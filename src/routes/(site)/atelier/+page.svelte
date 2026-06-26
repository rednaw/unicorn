<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { drawings, artist, atelierMaxZoom } from '$lib/content';
	import '$lib/atelier/backgrounds.css';
	import BackLink from '$lib/atelier/BackLink.svelte';
	import NearCue from '$lib/atelier/NearCue.svelte';
	import Canvas from '$lib/atelier/Canvas.svelte';
	import { createAtelierGestures } from '$lib/atelier/gestures.svelte';
	import { createAtelierView } from '$lib/atelier/view.svelte';
	import { queueDrawingPrefetch } from '$lib/atelier/drawing-prefetch';
	import { createSpatialAudioLoop } from '$lib/atelier/spatial-audio-loop.svelte';
	import { observeBrowserChromeInsets } from '$lib/atelier/browser-chrome-insets';
	import { observeViewport } from '$lib/atelier/viewport-metrics';
	import { enterSpatial, leaveSpatial, unlock, armSpatial, engine } from '$lib/atelier/audio-engine.svelte';

	let focusedId = $state<string | null>(browser ? page.url.searchParams.get('focus') : null);
	/** Pins HUD / HMV to gallery focus until the visitor pans or zooms. */
	let nearLockId = $state<string | null>(browser ? page.url.searchParams.get('focus') : null);
	let prefetchIds = $state(new Set<string>());
	let atelierEl = $state<HTMLDivElement>();
	let viewport = $state<HTMLDivElement>();

	const view = createAtelierView(atelierMaxZoom());
	const spatial = createSpatialAudioLoop(view);

	const displayNearId = $derived(
		nearLockId ?? spatial.dominantAudioDrawingId ?? spatial.nearDrawingId
	);

	function releaseNearLock() {
		nearLockId = null;
	}

	const gestures = createAtelierGestures(view, {
		unlock,
		armSpatial,
		releaseNearLock,
		onPrefetchDrawing: (id) => queueDrawingPrefetch(prefetchIds, id, (next) => (prefetchIds = next)),
		onEscape: () => goto(`${base}/`),
		viewport: () => viewport
	});

	function focusDrawingById(id: string) {
		focusedId = id;
		nearLockId = id;
		armSpatial();
		queueDrawingPrefetch(prefetchIds, id, (next) => (prefetchIds = next));
		const drawing = drawings.find((d) => d.id === id);
		if (drawing) view.focusDrawing(drawing);
	}

	onMount(() => {
		enterSpatial();

		let unobserveViewport: (() => void) | undefined;
		let unobserveBrowserChrome: (() => void) | undefined;
		let viewportEl: HTMLDivElement | undefined;

		void tick().then(() => {
			if (!viewport || !atelierEl) return;
			viewportEl = viewport;

			// Fit from window metrics (already in view) — no DOM geometry read on load.
			view.onViewportResize();

			unobserveViewport = observeViewport(viewport, (metrics) => {
				view.setMetrics(metrics);
				view.onViewportResize();
			});

			const chromeEl = atelierEl;
			requestAnimationFrame(() => {
				unobserveBrowserChrome = observeBrowserChromeInsets(chromeEl);
			});

			spatial.start();

			if (focusedId) {
				requestAnimationFrame(() => {
					if (focusedId) focusDrawingById(focusedId);
				});
			}

			viewport.addEventListener('wheel', gestures.onWheel, { passive: false });
			viewport.addEventListener('touchmove', gestures.onTouchMove, { passive: false });
		});

		window.addEventListener('keydown', gestures.onKeyDown);
		return () => {
			unobserveBrowserChrome?.();
			unobserveViewport?.();
			viewportEl?.removeEventListener('wheel', gestures.onWheel);
			viewportEl?.removeEventListener('touchmove', gestures.onTouchMove);
			window.removeEventListener('keydown', gestures.onKeyDown);
			spatial.stop();
			view.dispose();
			leaveSpatial();
		};
	});
</script>

<svelte:head>
	<title>De werktafel — {artist.name}</title>
	<meta
		name="description"
		content="Verken de tekeningen op de werktafel — zoom, pan en ontdek de bijbehorende muziek."
	/>
</svelte:head>

<div class="atelier" bind:this={atelierEl}>
	<BackLink />
	<NearCue nearDrawingId={engine.armed ? displayNearId : null} />

	<Canvas
		{view}
		{gestures}
		bind:viewport
		{focusedId}
		{prefetchIds}
		nearDrawingId={displayNearId}
		onFocusDrawing={focusDrawingById}
	/>
</div>

<style>
	.atelier {
		height: 100vh;
		height: 100lvh;
		overflow: hidden;
		position: relative;
		font-family: var(--font-serif);
		touch-action: none;
		overscroll-behavior: none;
	}
</style>

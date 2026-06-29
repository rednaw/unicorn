<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { drawings, artist, atelierMaxZoom } from '$lib/content';
	import { prefetchVisibleInView, requestDrawing } from '$lib/drawing/prefetch.svelte';
	import '$lib/atelier/backgrounds.css';
	import BackLink from '$lib/atelier/BackLink.svelte';
	import NearCue from '$lib/atelier/NearCue.svelte';
	import Canvas from '$lib/atelier/Canvas.svelte';
	import { createAtelierGestures } from '$lib/atelier/gestures.svelte';
	import { createAtelierView } from '$lib/atelier/view.svelte';
	import { createSpatialAudioLoop } from '$lib/atelier/spatial-audio-loop.svelte';
	import { observeBrowserChromeInsets } from '$lib/atelier/browser-chrome-insets';
	import { observeViewport } from '$lib/atelier/viewport-metrics';
	import { enterSpatial, leaveSpatial, unlock, armSpatial, engine } from '$lib/atelier/audio-engine.svelte';

	let focusedId = $state<string | null>(browser ? page.url.searchParams.get('focus') : null);
	/** Pins HUD / HMV to gallery focus until the visitor pans or zooms. */
	let nearLockId = $state<string | null>(browser ? page.url.searchParams.get('focus') : null);
	let atelierEl = $state<HTMLDivElement>();
	let viewport = $state<HTMLDivElement>();

	const view = createAtelierView(atelierMaxZoom());
	const spatial = createSpatialAudioLoop(view);

	const displayNearId = $derived(
		nearLockId ?? spatial.dominantAudioDrawingId ?? spatial.nearDrawingId
	);

	let settleTimer: ReturnType<typeof setTimeout> | undefined;

	function scheduleViewportPrefetch() {
		if (!browser) return;
		clearTimeout(settleTimer);
		settleTimer = setTimeout(() => {
			if (view.metrics.width === 0) return;
			prefetchVisibleInView(
				view.getView(),
				view.metrics,
				view.layoutMode,
				(d) => view.drawingPos(d)
			);
		}, 200);
	}

	$effect(() => {
		view.tx;
		view.ty;
		view.zoom;
		view.layoutMode;
		scheduleViewportPrefetch();
	});

	function releaseNearLock() {
		nearLockId = null;
	}

	const gestures = createAtelierGestures(view, {
		unlock,
		armSpatial,
		releaseNearLock,
		onPrefetchDrawing: (id) => requestDrawing(id, 'full'),
		onEscape: () => goto(`${base}/`),
		viewport: () => viewport
	});

	function focusDrawingById(id: string) {
		unlock();
		focusedId = id;
		nearLockId = id;
		requestDrawing(id, 'full');
		const drawing = drawings.find((d) => d.id === id);
		// Arm audio only once the view settles on the target — playing during the
		// programmatic focus sweep would briefly trigger tracks the view passes over.
		if (drawing) view.focusDrawing(drawing, armSpatial);
		else armSpatial();
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
			} else {
				scheduleViewportPrefetch();
			}

			viewport.addEventListener('wheel', gestures.onWheel, { passive: false });
			viewport.addEventListener('touchmove', gestures.onTouchMove, { passive: false });
		});

		window.addEventListener('keydown', gestures.onKeyDown);
		return () => {
			clearTimeout(settleTimer);
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
	<title>De kamer — {artist.name}</title>
	<meta
		name="description"
		content="Tekeningen op tafel — zoom, pan en ontdek de bijbehorende muziek."
	/>
</svelte:head>

<div class="atelier" bind:this={atelierEl}>
	<BackLink />
	<NearCue nearDrawingId={engine.armed || nearLockId ? displayNearId : null} />

	<Canvas
		{view}
		{gestures}
		bind:viewport
		{focusedId}
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

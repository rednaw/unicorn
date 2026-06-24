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
	import { observeViewport, readViewportMetrics } from '$lib/atelier/viewport-metrics';
	import { enterSpatial, leaveSpatial, unlock } from '$lib/atelier/audio-engine.svelte';

	let focusedId = $state<string | null>(browser ? page.url.searchParams.get('focus') : null);
	let prefetchIds = $state(new Set<string>());
	let viewport = $state<HTMLDivElement>();

	const view = createAtelierView(atelierMaxZoom());
	const spatial = createSpatialAudioLoop(view);
	const gestures = createAtelierGestures(view, {
		unlock,
		onPrefetchDrawing: (id) => queueDrawingPrefetch(prefetchIds, id, (next) => (prefetchIds = next)),
		onEscape: () => goto(`${base}/`),
		syncViewportOffset: () => {
			if (viewport) view.setMetrics(readViewportMetrics(viewport));
		}
	});

	function focusDrawingById(id: string) {
		focusedId = id;
		queueDrawingPrefetch(prefetchIds, id, (next) => (prefetchIds = next));
		const drawing = drawings.find((d) => d.id === id);
		if (drawing) view.focusDrawing(drawing);
	}

	onMount(() => {
		enterSpatial();

		let unobserveViewport: (() => void) | undefined;
		let viewportEl: HTMLDivElement | undefined;

		void tick().then(() => {
			if (!viewport) return;
			viewportEl = viewport;
			unobserveViewport = observeViewport(viewport, (metrics) => {
				view.setMetrics(metrics);
				view.onViewportResize();
			});
			spatial.start();

			if (focusedId) focusDrawingById(focusedId);

			viewport.addEventListener('wheel', gestures.onWheel, { passive: false });
			viewport.addEventListener('touchmove', gestures.onTouchMove, { passive: false });
		});

		window.addEventListener('keydown', gestures.onKeyDown);
		return () => {
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
</svelte:head>

<div class="atelier">
	<BackLink />
	<NearCue />

	<Canvas
		{view}
		{gestures}
		bind:viewport
		{focusedId}
		{prefetchIds}
		speakerLevels={spatial.speakerLevels}
		onFocusDrawing={focusDrawingById}
		onFocusSpeaker={(track) => view.focusSpeaker(track)}
	/>
</div>

<style>
	.atelier {
		height: 100vh;
		height: 100svh;
		overflow: hidden;
		position: relative;
		font-family: var(--font-serif);
		touch-action: none;
		overscroll-behavior: none;
	}
</style>

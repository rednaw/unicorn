<script lang="ts">
	import type { Drawing } from '$lib/content';
	import { cacheAsset, peekCachedAsset } from '$lib/drawing/asset-cache';

	let {
		drawing,
		prefetch = false,
		viewTransitionName
	}: {
		drawing: Drawing;
		/** Parent queued this piece for full-res download. */
		prefetch?: boolean;
		viewTransitionName?: string;
	} = $props();

	let thumbSrc = $state<string | undefined>(peekCachedAsset(drawing.thumb));
	let fullSrc = $state<string | undefined>(undefined);
	let shouldLoadFull = $state(false);

	const originalReady = $derived(fullSrc !== undefined);

	function startFullPrefetch() {
		if (shouldLoadFull) return;
		shouldLoadFull = true;
	}

	$effect(() => {
		let cancelled = false;
		void cacheAsset(drawing.thumb).then((url) => {
			if (!cancelled) thumbSrc = url;
		});
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (prefetch) startFullPrefetch();
	});

	$effect(() => {
		if (!shouldLoadFull || fullSrc) return;
		let cancelled = false;
		void cacheAsset(drawing.src).then((url) => {
			if (!cancelled) fullSrc = url;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

<div
	class="atelier-drawing"
	style:aspect-ratio="{drawing.srcWidth} / {drawing.srcHeight}"
>
	{#if thumbSrc}
		<img
			class="atelier-drawing-img atelier-drawing-img--thumb"
			class:atelier-drawing-img--hidden={originalReady}
			src={thumbSrc}
			width={drawing.srcWidth}
			height={drawing.srcHeight}
			alt=""
			aria-hidden="true"
			decoding="async"
			draggable="false"
		/>
	{/if}
	{#if fullSrc}
		<img
			class="atelier-drawing-img atelier-drawing-img--full"
			src={fullSrc}
			width={drawing.srcWidth}
			height={drawing.srcHeight}
			alt={drawing.alt}
			decoding="async"
			draggable="false"
			style:view-transition-name={viewTransitionName}
		/>
	{/if}
</div>

<style>
	.atelier-drawing {
		display: grid;
		width: 100%;
		min-height: 0;
	}

	.atelier-drawing-img {
		grid-area: 1 / 1;
		display: block;
		width: 100%;
		height: auto;
		pointer-events: none;
	}

	.atelier-drawing-img--thumb {
		transition: opacity 180ms ease;
	}

	.atelier-drawing-img--thumb.atelier-drawing-img--hidden {
		opacity: 0;
	}

	.atelier-drawing-img--full {
		opacity: 1;
	}
</style>

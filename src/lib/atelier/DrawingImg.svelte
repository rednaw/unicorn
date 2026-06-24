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

	let thumbSrc = $state<string | undefined>(undefined);
	let fullSrc = $state<string | undefined>(undefined);
	let shouldLoadFull = $state(false);

	const originalReady = $derived(fullSrc !== undefined);

	function startFullPrefetch() {
		if (shouldLoadFull) return;
		shouldLoadFull = true;
	}

	$effect(() => {
		const thumb = drawing.thumb;
		const cached = peekCachedAsset(thumb);
		if (cached) {
			thumbSrc = cached;
			return;
		}
		let cancelled = false;
		void cacheAsset(thumb).then((url) => {
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
		const src = drawing.src;
		let cancelled = false;
		void cacheAsset(src).then((url) => {
			if (!cancelled) fullSrc = url;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

<div class="atelier-drawing">
	{#if thumbSrc}
		<img
			class="atelier-drawing-img atelier-drawing-img--thumb"
			class:atelier-drawing-img--hidden={originalReady}
			src={thumbSrc}
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
		min-height: 4rem;
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

<script lang="ts">
	import type { Drawing } from '$lib/content';
	import { fullReadyIds } from '$lib/drawing/prefetch.svelte';

	let {
		drawing,
		viewTransitionName
	}: {
		drawing: Drawing;
		viewTransitionName?: string;
	} = $props();

	let fullLoaded = $state(false);

	const ready = $derived(fullReadyIds().has(drawing.id));
	const showFull = $derived(ready || fullLoaded);
</script>

<div
	class="atelier-drawing"
	style:aspect-ratio="{drawing.srcWidth} / {drawing.srcHeight}"
>
	<img
		class="atelier-drawing-img atelier-drawing-img--thumb"
		class:atelier-drawing-img--hidden={showFull}
		src={drawing.thumb}
		width={drawing.srcWidth}
		height={drawing.srcHeight}
		alt=""
		aria-hidden="true"
		decoding="async"
		draggable="false"
	/>
	{#if showFull}
		<img
			class="atelier-drawing-img atelier-drawing-img--full"
			src={drawing.src}
			width={drawing.srcWidth}
			height={drawing.srcHeight}
			alt={drawing.title}
			decoding="async"
			draggable="false"
			style:view-transition-name={viewTransitionName}
			onload={() => {
				fullLoaded = true;
			}}
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

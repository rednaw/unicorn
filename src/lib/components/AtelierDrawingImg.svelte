<script lang="ts">
	import type { Drawing } from '$lib/content';
	import { viewportLoad } from '$lib/actions/viewport-load';

	let {
		drawing,
		eager = false,
		viewTransitionName
	}: {
		drawing: Drawing;
		/** Prefetch original immediately (e.g. `?focus=`). */
		eager?: boolean;
		viewTransitionName?: string;
	} = $props();

	let originalReady = $state(false);
	let shouldLoad = $state(false);
	let thumbMissing = $state(false);

	function prefetchOriginal() {
		if (shouldLoad) return;
		shouldLoad = true;
	}

	function onVisible() {
		prefetchOriginal();
	}

	$effect(() => {
		if (eager) prefetchOriginal();
	});

	$effect(() => {
		if (!shouldLoad || originalReady) return;

		const img = new Image();
		img.onload = () => {
			originalReady = true;
		};
		img.onerror = () => {
			originalReady = true;
		};
		img.src = drawing.src;
	});

	function imgSrc(): string | undefined {
		if (originalReady) return drawing.src;
		if (thumbMissing) return undefined;
		return drawing.thumb;
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="atelier-drawing" use:viewportLoad={onVisible}>
	{#if imgSrc()}
		<img
			class="atelier-drawing-img"
			src={imgSrc()}
			alt={drawing.alt}
			loading="lazy"
			decoding="async"
			draggable="false"
			style:view-transition-name={viewTransitionName}
			onerror={(e) => {
				const el = e.currentTarget as HTMLImageElement;
				if (!originalReady && !shouldLoad) {
					thumbMissing = true;
					return;
				}
				if (originalReady && el.src !== drawing.src) el.src = drawing.src;
			}}
		/>
	{/if}
</div>

<style>
	.atelier-drawing {
		display: block;
		min-height: 4rem;
	}

	.atelier-drawing-img {
		display: block;
		width: 100%;
		height: auto;
		pointer-events: none;
	}
</style>

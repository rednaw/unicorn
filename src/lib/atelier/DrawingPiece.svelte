<script lang="ts">
	import { base } from '$app/paths';
	import type { Drawing } from '$lib/content';
	import { audioIndexForDrawing, DEFAULT_DRAWING_WIDTH } from '$lib/content';
	import { HMV_PLAQUE } from './hmv-plaque';
	import DrawingImg from './DrawingImg.svelte';

	let {
		drawing,
		pos,
		prefetch = false,
		focused = false,
		isNear = false,
		onfocus
	}: {
		drawing: Drawing;
		pos: { x: number; y: number };
		prefetch?: boolean;
		focused?: boolean;
		isNear?: boolean;
		onfocus: () => void;
	} = $props();
</script>

<button
	type="button"
	class="piece piece--drawing"
	class:piece--has-audio={!!drawing.track}
	data-drawing-id={drawing.id}
	data-audio-index={drawing.track ? audioIndexForDrawing(drawing.id) : undefined}
	style:left="{pos.x}px"
	style:top="{pos.y}px"
	style:width="{drawing.width ?? DEFAULT_DRAWING_WIDTH}px"
	style:--rot="{drawing.rotation ?? 0}deg"
	onclick={onfocus}
	aria-label={drawing.track ? `${drawing.title} — ${drawing.track.title}` : drawing.title}
	aria-pressed={isNear}
>
	<div class="piece__mat">
		<DrawingImg
			{drawing}
			{prefetch}
			viewTransitionName={focused ? `piece-${drawing.id}` : undefined}
		/>
		{#if drawing.track}
			<figure class="piece__plaque" aria-hidden="true">
				<img
					class="piece__hmv"
					class:piece__hmv--singing={isNear}
					src="{base}{HMV_PLAQUE.src}"
					alt=""
					width={HMV_PLAQUE.srcWidth}
					height={HMV_PLAQUE.srcHeight}
					draggable="false"
					decoding="async"
				/>
			</figure>
		{/if}
	</div>
</button>

<style>
	.piece {
		position: absolute;
		transform: rotate(var(--rot, 0deg));
	}

	.piece--drawing {
		appearance: none;
		border: none;
		padding: 0;
		background: transparent;
		cursor: zoom-in;
		display: block;
		transition: transform 250ms ease, box-shadow 250ms ease;
		touch-action: manipulation;
		/* box-shadow (not filter: drop-shadow): a filter rasterizes the large
		   image into a GPU buffer sized by the zoomed device pixels, which blows
		   up GPU memory as you zoom. The mats are rectangular, so this is
		   visually identical and far cheaper. */
		box-shadow:
			0 18px 36px rgba(0, 0, 0, 0.22),
			0 2px 6px rgba(0, 0, 0, 0.12);
	}

	.piece--drawing:hover {
		transform: rotate(var(--rot, 0deg)) translateY(-3px);
		box-shadow:
			0 24px 44px rgba(0, 0, 0, 0.28),
			0 4px 10px rgba(0, 0, 0, 0.14);
		z-index: 10;
	}

	.piece__mat {
		background: #fbf6e9;
		padding: 14px;
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.65),
			inset 0 0 0 2px rgba(26, 24, 20, 0.07);
	}

	.piece--has-audio .piece__mat {
		padding-bottom: 0;
	}

	.piece__plaque {
		margin: 0;
		padding: 5px 8px 6px;
		border-top: 1px solid rgba(212, 175, 95, 0.28);
		background: linear-gradient(180deg, #f0ead8 0%, #e8e0cc 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.55),
			inset 0 -1px 0 rgba(26, 24, 20, 0.05);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.piece__hmv {
		display: block;
		width: 44px;
		height: auto;
		aspect-ratio: 1200 / 898;
		object-fit: cover;
		object-position: center;
		pointer-events: none;
		user-select: none;
		-webkit-user-drag: none;
		border: 1px solid rgba(26, 24, 20, 0.12);
		box-shadow: 0 1px 2px rgba(26, 24, 20, 0.15);
		opacity: 0.38;
		filter: saturate(0.55) brightness(0.88);
		transition:
			opacity 420ms ease,
			box-shadow 420ms ease,
			border-color 420ms ease,
			filter 420ms ease;
	}

	.piece__hmv--singing {
		opacity: 0.92;
		filter: saturate(0.92) brightness(1.02);
		border-color: rgba(212, 175, 95, 0.55);
		box-shadow:
			0 1px 3px rgba(26, 24, 20, 0.2),
			0 0 10px rgba(212, 175, 95, 0.28);
	}

	@media (prefers-reduced-motion: reduce) {
		.piece__hmv {
			transition-duration: 0.01ms;
		}
	}
</style>

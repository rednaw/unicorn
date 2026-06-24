<script lang="ts">
	import type { Drawing } from '$lib/content';
	import { trackForDrawing } from '$lib/content';
	import DrawingImg from './DrawingImg.svelte';

	let {
		drawing,
		prefetch = false,
		focused = false,
		onfocus
	}: {
		drawing: Drawing;
		prefetch?: boolean;
		focused?: boolean;
		onfocus: () => void;
	} = $props();

	const pairedTrack = $derived(trackForDrawing(drawing.id));
</script>

<button
	type="button"
	class="piece piece--drawing"
	data-drawing-id={drawing.id}
	style:left="{drawing.pos?.x ?? 0}px"
	style:top="{drawing.pos?.y ?? 0}px"
	style:width="{drawing.width ?? 320}px"
	style:--rot="{drawing.rotation ?? 0}deg"
	onclick={onfocus}
	aria-label={pairedTrack ? `${drawing.title} — ${pairedTrack.title}` : drawing.title}
>
	<DrawingImg
		{drawing}
		{prefetch}
		viewTransitionName={focused ? `piece-${drawing.id}` : undefined}
	/>
	{#if pairedTrack}
		<p class="piece__track">
			<span class="piece__track-label">geluid</span>
			{pairedTrack.title}
		</p>
	{/if}
</button>

<style>
	.piece {
		position: absolute;
		transform: rotate(var(--rot, 0deg));
	}

	.piece--drawing {
		appearance: none;
		background: #fbf6e9;
		border: none;
		padding: 14px 14px 36px;
		box-shadow: 0 18px 36px -22px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.2);
		cursor: zoom-in;
		display: block;
		transition: transform 250ms ease, box-shadow 250ms ease;
		touch-action: manipulation;
	}

	.piece--drawing:hover {
		transform: rotate(var(--rot, 0deg)) translateY(-3px);
		box-shadow: 0 28px 48px -22px rgba(0, 0, 0, 0.5), 0 3px 10px -2px rgba(0, 0, 0, 0.25);
		z-index: 10;
	}

	.piece__track {
		margin: 0.35rem 0 0;
		padding-top: 0.35rem;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		font-family: var(--font-museum);
		font-size: 0.72rem;
		font-style: italic;
		line-height: 1.35;
		color: rgba(26, 24, 20, 0.72);
		text-align: center;
	}

	.piece__track-label {
		display: block;
		font-family: var(--font-sans);
		font-size: 0.52rem;
		font-style: normal;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgba(26, 24, 20, 0.45);
		margin-bottom: 0.15rem;
	}
</style>

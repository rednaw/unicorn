<script lang="ts">
	import { drawingForTrack, tracks } from '$lib/content';
	import { engine } from './audio-engine.svelte';

	const nearTrack = $derived(engine.near.index >= 0 ? tracks[engine.near.index] : undefined);
	const nearDrawing = $derived(nearTrack ? drawingForTrack(nearTrack.id) : undefined);
</script>

{#if nearTrack}
	<div
		class="nearcue"
		style:opacity={Math.min(1, engine.near.level * 1.4)}
		aria-hidden="true"
	>
		<span class="nearcue__label">nu dichtbij</span>
		{#if nearDrawing}
			<span class="nearcue__drawing">{nearDrawing.title}</span>
			<span class="nearcue__sep" aria-hidden="true">·</span>
		{/if}
		<span class="nearcue__title">{nearTrack.title}</span>
	</div>
{/if}

<style>
	.nearcue {
		position: fixed;
		left: 50%;
		bottom: 1.25rem;
		transform: translateX(-50%);
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.35rem 0.85rem;
		border-radius: 9999px;
		background: rgba(20, 18, 14, 0.5);
		color: #efe9da;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		pointer-events: none;
		z-index: 40;
		transition: opacity 200ms linear;
		max-width: calc(100vw - 1.5rem);
	}

	.nearcue__label {
		font-family: var(--font-sans);
		font-size: 0.6rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.7;
		flex: none;
	}

	.nearcue__drawing {
		font-family: var(--font-museum);
		font-size: 0.95rem;
		white-space: nowrap;
		flex: none;
	}

	.nearcue__sep {
		opacity: 0.45;
		flex: none;
	}

	.nearcue__title {
		font-family: var(--font-museum);
		font-style: italic;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (prefers-reduced-motion: reduce) {
		.nearcue {
			transition: none;
		}
	}
</style>

<script lang="ts">
	import { drawings } from '$lib/content';
	import { engine } from './audio-engine.svelte';

	const nearDrawing = $derived(
		engine.near.drawingId ? drawings.find((d) => d.id === engine.near.drawingId) : undefined
	);
</script>

{#if nearDrawing?.track}
	<div class="nearcue" role="status">
		<span class="nearcue__pulse" aria-hidden="true"></span>
		<span class="nearcue__label">speelt</span>
		<span class="nearcue__drawing">{nearDrawing.title}</span>
		<span class="nearcue__sep" aria-hidden="true">·</span>
		<span class="nearcue__title">{nearDrawing.track.title}</span>
	</div>
{/if}

<style>
	.nearcue {
		position: fixed;
		left: 50%;
		bottom: 1.25rem;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.55rem 1rem;
		border-radius: 9999px;
		background: rgba(28, 24, 18, 0.88);
		color: #f5eed8;
		border: 1px solid rgba(212, 175, 95, 0.55);
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.35),
			0 0 24px rgba(212, 175, 95, 0.2);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		pointer-events: none;
		z-index: 40;
		font-family: var(--font-museum);
		font-size: 0.82rem;
		line-height: 1.2;
		max-width: min(92vw, 30rem);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nearcue__pulse {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 9999px;
		background: rgba(212, 175, 95, 0.95);
		box-shadow: 0 0 8px rgba(212, 175, 95, 0.8);
		flex-shrink: 0;
		animation: nearcue-pulse 1.4s ease-in-out infinite;
	}

	@keyframes nearcue-pulse {
		0%,
		100% {
			opacity: 0.55;
			transform: scale(0.85);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}

	.nearcue__label {
		font-family: var(--font-sans);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(212, 175, 95, 0.95);
		flex-shrink: 0;
	}

	.nearcue__drawing {
		font-style: italic;
		flex-shrink: 1;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nearcue__sep {
		opacity: 0.45;
		flex-shrink: 0;
	}

	.nearcue__title {
		opacity: 0.9;
		flex-shrink: 1;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (prefers-reduced-motion: reduce) {
		.nearcue__pulse {
			animation: none;
			opacity: 1;
		}
	}
</style>

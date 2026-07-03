<script lang="ts">
	import { drawings } from '$lib/content';

	let { drawingId, ended = false }: { drawingId: string | null; ended?: boolean } = $props();

	const nearDrawing = $derived(drawingId ? drawings.find((d) => d.id === drawingId) : undefined);

	const ariaLabel = $derived.by(() => {
		if (!nearDrawing) return '';
		const parts = [`${nearDrawing.title}, ${nearDrawing.year}, ${nearDrawing.medium}`];
		if (nearDrawing.track) {
			parts.push(`${nearDrawing.track.composer}: ${nearDrawing.track.title}`);
		}
		return parts.join('. ');
	});
</script>

<div
	class="nearcue"
	class:nearcue--hidden={!nearDrawing}
	class:nearcue--ended={ended && nearDrawing}
	role={nearDrawing ? 'status' : undefined}
	aria-hidden={!nearDrawing}
	aria-label={nearDrawing ? ariaLabel : undefined}
>
	{#if nearDrawing}
		<div class="nearcue__drawing">
			<span class="nearcue__drawing-title">{nearDrawing.title}</span>
			<span class="nearcue__drawing-meta">{nearDrawing.year} · {nearDrawing.medium}</span>
		</div>
		{#if nearDrawing.track}
			<div class="nearcue__audio">
				<span class="nearcue__composer">{nearDrawing.track.composer}</span>
				<span class="nearcue__piece">{nearDrawing.track.title}</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.nearcue {
		position: fixed;
		left: 50%;
		bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
		transform: translateX(-50%) translateY(calc(-1 * var(--browser-chrome-bottom, 0px)));
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.65rem 1rem 0.7rem;
		border-radius: 0.65rem;
		background: rgba(28, 24, 18, 0.9);
		color: #f5eed8;
		border: 1px solid rgba(212, 175, 95, 0.5);
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.35),
			0 0 24px rgba(212, 175, 95, 0.15);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		pointer-events: none;
		z-index: 50;
		max-width: min(92vw, 22rem);
		min-width: min(92vw, 16rem);
		min-height: 4.75rem;
		transition: opacity 420ms ease, visibility 420ms ease;
	}

	.nearcue--hidden {
		opacity: 0;
		visibility: hidden;
	}

	.nearcue--ended {
		opacity: 0.72;
		border-color: rgba(212, 175, 95, 0.28);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.28),
			0 0 12px rgba(212, 175, 95, 0.06);
	}

	.nearcue--ended .nearcue__composer,
	.nearcue--ended .nearcue__piece {
		color: rgba(245, 238, 216, 0.58);
	}

	.nearcue__drawing {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
		min-width: 0;
	}

	.nearcue__drawing-title {
		font-family: var(--font-museum);
		font-size: 0.95rem;
		font-style: italic;
		line-height: 1.25;
		color: #f5eed8;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nearcue__drawing-meta {
		font-family: var(--font-sans);
		font-size: 0.62rem;
		letter-spacing: 0.04em;
		line-height: 1.3;
		color: rgba(245, 238, 216, 0.62);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nearcue__audio {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding-top: 0.45rem;
		border-top: 1px solid rgba(212, 175, 95, 0.28);
		min-width: 0;
		min-height: 2.35rem;
	}

	.nearcue__composer {
		font-family: var(--font-sans);
		font-size: 0.58rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		line-height: 1.3;
		color: rgba(212, 175, 95, 0.88);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nearcue__piece {
		font-family: var(--font-museum);
		font-size: 0.78rem;
		font-style: italic;
		line-height: 1.3;
		color: rgba(245, 238, 216, 0.92);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (prefers-reduced-motion: reduce) {
		.nearcue {
			transition-duration: 0.01ms;
		}
	}
</style>

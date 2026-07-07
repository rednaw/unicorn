<script lang="ts">
	import { drawings } from '$lib/content';

	let {
		drawingId,
		ended = false,
		visible = true
	}: {
		drawingId: string | null;
		ended?: boolean;
		visible?: boolean;
	} = $props();

	const track = $derived(
		drawingId ? drawings.find((d) => d.id === drawingId)?.track : undefined
	);
	const show = $derived(!!track && visible);
</script>

<div
	class="nearcue"
	class:nearcue--hidden={!show}
	class:nearcue--ended={ended && show}
	role={show ? 'status' : undefined}
	aria-hidden={!show}
	aria-label={show && track ? `${track.composer}: ${track.title}` : undefined}
>
	{#if track}
		<span class="nearcue__composer">{track.composer}</span>
		<span class="nearcue__track">{track.title}</span>
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
		gap: 0.12rem;
		padding: 0.5rem 0.85rem 0.55rem;
		border-radius: 0.55rem;
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
		max-width: min(92vw, 20rem);
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

	.nearcue__composer {
		font-family: var(--font-sans);
		font-size: 0.58rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		line-height: 1.3;
		color: rgba(212, 175, 95, 0.88);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nearcue--ended .nearcue__composer {
		color: rgba(212, 175, 95, 0.55);
	}

	.nearcue__track {
		font-family: var(--font-museum);
		font-size: 0.82rem;
		font-style: italic;
		line-height: 1.3;
		color: rgba(245, 238, 216, 0.92);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nearcue--ended .nearcue__track {
		color: rgba(245, 238, 216, 0.58);
	}

	@media (prefers-reduced-motion: reduce) {
		.nearcue {
			transition-duration: 0.01ms;
		}
	}
</style>

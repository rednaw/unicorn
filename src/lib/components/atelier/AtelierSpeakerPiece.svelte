<script lang="ts">
	import type { Track } from '$lib/content';
	import { drawingForTrack } from '$lib/content';

	let {
		track,
		level = 0,
		onfocus
	}: {
		track: Track;
		level?: number;
		onfocus: () => void;
	} = $props();

	const pairedDrawing = $derived(drawingForTrack(track.id));
</script>

<button
	type="button"
	class="piece speaker"
	style:left="{track.pos?.x ?? 0}px"
	style:top="{track.pos?.y ?? 0}px"
	onclick={onfocus}
	aria-label={pairedDrawing
		? `Ga naar {track.title} bij {pairedDrawing.title}`
		: `Ga naar {track.title} door {track.composer}`}
>
	<span class="speaker__ring" style:--level={level.toFixed(3)}></span>
	<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
		<path
			d="M3 9v6h4l5 4V5L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
		/>
	</svg>
</button>

<style>
	.piece {
		position: absolute;
	}

	.speaker {
		appearance: none;
		background: var(--color-ink);
		color: var(--color-paper);
		border: none;
		width: 3rem;
		height: 3rem;
		min-width: 44px;
		min-height: 44px;
		border-radius: 9999px;
		display: grid;
		place-items: center;
		cursor: pointer;
		box-shadow: 0 14px 30px -16px rgba(0, 0, 0, 0.6);
		transform: translate(-50%, -50%);
		touch-action: manipulation;
	}

	.speaker__ring {
		position: absolute;
		inset: -8px;
		border-radius: 9999px;
		opacity: var(--level, 0);
		transition: opacity 140ms linear;
	}

	.speaker__ring::after {
		content: '';
		position: absolute;
		inset: 0;
		border: 1px solid rgba(0, 0, 0, 0.4);
		border-radius: 9999px;
		animation: speaker-pulse 2.4s ease-out infinite;
	}

	@keyframes speaker-pulse {
		0% {
			transform: scale(1);
			opacity: 0.6;
		}
		100% {
			transform: scale(1.8);
			opacity: 0;
		}
	}
</style>

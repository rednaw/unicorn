<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { artist, entryDrawingId } from '$lib/content';
	import { requestDrawing } from '$lib/drawing/prefetch.svelte';
	import { initAudio, unlock } from '$lib/atelier/audio-engine.svelte';

	const DOOR_WIDTH = 1536;
	const DOOR_HEIGHT = 1024;
	const doorSketch = `${base}/hall/door-ajar-sketch.webp`;

	function prefetchEntryDrawing() {
		requestDrawing(entryDrawingId, 'entry');
	}

	async function onDoorClick(e: MouseEvent) {
		e.preventDefault();
		initAudio();
		// Prime the entry track within this gesture so it can play once inside the atelier (iOS).
		await unlock([entryDrawingId]);
		prefetchEntryDrawing();
		await goto(`${base}/atelier/?focus=${entryDrawingId}`);
	}
</script>

{#snippet doorImage()}
	<img
		class="threshold__sketch"
		src={doorSketch}
		width={DOOR_WIDTH}
		height={DOOR_HEIGHT}
		alt=""
	/>
{/snippet}

<svelte:head>
	<title>{artist.name}</title>
	<meta name="description" content={artist.tagline} />
</svelte:head>

<section class="threshold" aria-label="Voor de deur">
	<a class="threshold__colofon" href="{base}/credits/">colofon</a>

	<a
		class="threshold__frame"
		href="{base}/atelier/?focus={entryDrawingId}"
		aria-label="Naar binnen — van dichtbij"
		onpointerdown={prefetchEntryDrawing}
		onclick={onDoorClick}
	>
			{@render doorImage()}
	</a>
</section>

<style>
	.threshold {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
		padding-inline: max(0.75rem, env(safe-area-inset-left, 0px))
			max(0.75rem, env(safe-area-inset-right, 0px));
	}

	.threshold__colofon {
		position: absolute;
		right: max(0.75rem, env(safe-area-inset-right, 0px));
		bottom: 0.65rem;
		z-index: 3;
		padding: 0.2rem 0.45rem;
		border-radius: 2px;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: lowercase;
		color: rgba(251, 250, 246, 0.95);
		background: rgba(26, 24, 20, 0.42);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		text-decoration: none;
		transition: background 200ms ease, color 200ms ease;
	}

	.threshold__colofon:hover,
	.threshold__colofon:focus-visible {
		color: #fff;
		background: rgba(26, 24, 20, 0.58);
		outline: none;
	}

	.threshold__colofon:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.threshold__frame {
		position: absolute;
		inset-block: 0;
		left: 50%;
		transform: translateX(-50%);
		aspect-ratio: 1536 / 1024;
		width: auto;
		display: block;
		color: inherit;
		text-decoration: none;
	}

	.threshold__sketch {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		user-select: none;
		-webkit-user-drag: none;
		pointer-events: none;
	}

	a.threshold__frame {
		cursor: pointer;
		transition: filter 220ms ease;
	}

	a.threshold__frame:hover,
	a.threshold__frame:focus-visible {
		filter: brightness(1.04);
		outline: none;
	}

	a.threshold__frame:focus-visible {
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35);
	}

	/* Short landscape viewports (phones): fill width, anchor crop to floor */
	@media (orientation: landscape) and (max-height: 31.25rem) {
		.threshold {
			padding-inline: env(safe-area-inset-left, 0px) env(safe-area-inset-right, 0px);
		}

		.threshold__frame {
			inset: 0;
			width: 100%;
			height: 100%;
			transform: none;
			aspect-ratio: auto;
		}

		.threshold__sketch {
			object-fit: cover;
			object-position: center bottom;
		}
	}
</style>

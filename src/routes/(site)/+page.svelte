<script lang="ts">
	import { base } from '$app/paths';
	import { artist, drawings } from '$lib/content';
	import { cacheAsset } from '$lib/drawing/asset-cache';
	import { initAudio, unlock } from '$lib/atelier/audio-engine.svelte';

	const DOOR_WIDTH = 1536;
	const DOOR_HEIGHT = 1024;
	const doorSketch = `${base}/hall/door-ajar-sketch.webp`;
	const maskers = drawings.find((d) => d.id === 'maskers');

	function onDoorPointerDown() {
		initAudio();
		unlock();
		if (!maskers) return;
		void cacheAsset(maskers.thumb);
		void cacheAsset(maskers.src);
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
	{#if maskers}
		<a
			class="threshold__frame"
			href="{base}/atelier/?focus={maskers.id}"
			aria-label="Naar binnen — van dichtbij"
			onpointerdown={onDoorPointerDown}
		>
			{@render doorImage()}
		</a>
	{:else}
		<div class="threshold__frame">
			{@render doorImage()}
		</div>
	{/if}
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

<script lang="ts">
	import { onMount } from 'svelte';
	import { asset, resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { artist, entryDrawingId } from '$lib/content';
	import { requestDrawing, warmAllDrawingThumbs } from '$lib/drawing/prefetch.svelte';
	import { initAudio, prepareContext } from '$lib/atelier/audio-player.svelte';

	const DOOR_WIDTH = 1536;
	const DOOR_HEIGHT = 1024;
	const doorSketch = asset('/hall/door-ajar-sketch.webp');

	let doorImg = $state<HTMLImageElement>();
	let thumbsQueued = false;

	function afterNextPaint(fn: () => void) {
		requestAnimationFrame(() => requestAnimationFrame(fn));
	}

	function onDoorRendered() {
		if (thumbsQueued) return;
		thumbsQueued = true;
		afterNextPaint(() => warmAllDrawingThumbs());
	}

	onMount(() => {
		if (doorImg?.complete) onDoorRendered();
	});

	async function onDoorClick(e: MouseEvent) {
		e.preventDefault();
		initAudio();
		await prepareContext();
		requestDrawing(entryDrawingId, 'thumb');
		await goto(resolve('/atelier/'));
	}
</script>

{#snippet doorImage()}
	<img
		class="threshold__sketch"
		bind:this={doorImg}
		src={doorSketch}
		width={DOOR_WIDTH}
		height={DOOR_HEIGHT}
		alt=""
		decoding="async"
		fetchpriority="high"
		onload={onDoorRendered}
	/>
{/snippet}

<svelte:head>
	<title>{artist.name}</title>
	<meta name="description" content={artist.tagline} />
</svelte:head>

<section class="threshold" aria-label="Voor de deur">
	<div class="threshold__stage">
		<div class="threshold__visual" aria-hidden="true">
			{@render doorImage()}
		</div>
		<a
			class="threshold__frame"
			href={resolve('/atelier/')}
			aria-label="Naar binnen"
			onclick={onDoorClick}
		></a>
		<a class="threshold__colofon" href={resolve('/credits/')}>
			<span class="threshold__colofon-label">colofon</span>
		</a>
	</div>
</section>

<style>
	.threshold {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
		display: flex;
		align-items: stretch;
		justify-content: center;
		/* Match sketch paper if cover reveals an edge */
		background: var(--color-hall-paper);
	}

	.threshold__stage {
		position: relative;
		flex: 1 1 auto;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		/* Invisible door hit layer notch — matches colofon 48px + inset */
		--colofon-corner: 4.5rem;
	}

	.threshold__visual {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
	}

	.threshold__colofon {
		position: absolute;
		right: max(0.75rem, env(safe-area-inset-right, 0px));
		bottom: max(0.65rem, env(safe-area-inset-bottom, 0px));
		z-index: 3;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 48px;
		min-height: 48px;
		text-decoration: none;
		color: inherit;
	}

	.threshold__colofon-label {
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
		pointer-events: none;
		transition: background 200ms ease, color 200ms ease;
	}

	.threshold__colofon:hover .threshold__colofon-label,
	.threshold__colofon:focus-visible .threshold__colofon-label {
		color: #fff;
		background: rgba(26, 24, 20, 0.58);
	}

	.threshold__colofon:focus-visible {
		outline: none;
	}

	.threshold__colofon:focus-visible .threshold__colofon-label {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.threshold__frame {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: block;
		color: inherit;
		text-decoration: none;
		cursor: pointer;
		clip-path: polygon(
			0 0,
			100% 0,
			100% calc(100% - var(--colofon-corner)),
			calc(100% - var(--colofon-corner)) calc(100% - var(--colofon-corner)),
			calc(100% - var(--colofon-corner)) 100%,
			0 100%
		);
	}

	.threshold__sketch {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center center;
		user-select: none;
		-webkit-user-drag: none;
		transition: filter 220ms ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.threshold__sketch {
			transition-duration: 0.01ms;
		}
	}

	.threshold__stage:has(.threshold__frame:hover) .threshold__sketch,
	.threshold__stage:has(.threshold__frame:focus-visible) .threshold__sketch {
		filter: brightness(1.04);
	}

	.threshold__frame:focus-visible {
		outline: 2px solid rgba(0, 0, 0, 0.35);
		outline-offset: -6px;
	}

	/* Landscape (phone + laptop): anchor crop to the floor */
	@media (orientation: landscape) {
		.threshold__sketch {
			object-position: center bottom;
		}
	}
</style>

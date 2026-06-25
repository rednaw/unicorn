<script lang="ts">
	import { base } from '$app/paths';
	import { artist, drawings } from '$lib/content';
	import { cacheAsset } from '$lib/drawing/asset-cache';
	import { initAudio, unlock } from '$lib/atelier/audio-engine.svelte';
	import CachedDrawingImg from '$lib/drawing/CachedDrawingImg.svelte';

	function onPlatePointerDown(drawing: (typeof drawings)[number]) {
		initAudio();
		unlock();
		void cacheAsset(drawing.thumb);
		void cacheAsset(drawing.src);
	}
</script>

<svelte:head>
	<title>{artist.name}</title>
	<meta name="description" content={artist.tagline} />
</svelte:head>

<section class="gallery">
	<ul class="gallery__grid">
		{#each drawings as drawing (drawing.id)}
			<li class="gallery__item">
				<a
					class="plate"
					href="{base}/atelier/?focus={drawing.id}"
					aria-label="{drawing.title} — werktafel"
					onpointerdown={() => onPlatePointerDown(drawing)}
				>
					<div class="plate__frame">
						<CachedDrawingImg
							url={drawing.thumb}
							alt={drawing.alt}
							loading="lazy"
							viewTransitionName="piece-{drawing.id}"
						/>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</section>

<style>
	.gallery {
		padding-top: clamp(1.25rem, 4vw, 3rem);
		padding-bottom: 0;
		padding-inline: max(1.25rem, env(safe-area-inset-left, 0px))
			max(1.25rem, env(safe-area-inset-right, 0px));
		max-width: 80rem;
		margin: 0 auto;
	}

	.gallery__grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: clamp(2.5rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 3rem);
	}

	.gallery__item {
		margin: 0;
	}

	.plate {
		display: block;
		width: 100%;
		color: inherit;
		text-decoration: none;
	}

	.plate__frame {
		background: var(--color-paper);
		padding: 1.25rem;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
		transition: box-shadow 300ms ease, transform 300ms ease;
		aspect-ratio: 4 / 5;
		display: grid;
		place-items: center;
		overflow: hidden;
	}

	.plate:hover .plate__frame {
		box-shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.25);
		transform: translateY(-2px);
	}

	.plate__frame :global(img) {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
</style>

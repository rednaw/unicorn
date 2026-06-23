<script lang="ts">
	import { base } from '$app/paths';
	import { artist, drawings } from '$lib/content';
	import { trackForDrawing, trackIndexForDrawing } from '$lib/pairings';
	import { playTrack, site } from '$lib/site-state.svelte';
</script>

<svelte:head>
	<title>{artist.name}</title>
	<meta name="description" content={artist.tagline} />
</svelte:head>

<section class="gallery">
	<ul class="gallery__grid">
		{#each drawings as drawing (drawing.id)}
			{@const pairedTrack = trackForDrawing(drawing.id)}
			{@const pairedIndex = trackIndexForDrawing(drawing.id)}
			<li class="gallery__item">
				<div class="plate">
					<a class="plate__link" href="{base}/werk/{drawing.id}/" aria-label={drawing.title}>
						<div class="plate__frame">
							<img src={drawing.src} alt={drawing.alt} loading="lazy" />
						</div>
					</a>
					{#if pairedTrack && pairedIndex !== undefined}
						<button
							type="button"
							class="plate__play"
							class:plate__play--active={site.index === pairedIndex && site.isPlaying}
							onclick={() => playTrack(pairedIndex)}
							aria-label="{site.index === pairedIndex && site.isPlaying
								? 'Pauzeer'
								: 'Speel'} {pairedTrack.title}"
						>
							{#if site.index === pairedIndex && site.isPlaying}
								<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
									<rect x="6" y="5" width="4" height="14" />
									<rect x="14" y="5" width="4" height="14" />
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
									<path d="M7 5v14l12-7z" />
								</svg>
							{/if}
						</button>
					{/if}
				</div>
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
		position: relative;
		width: 100%;
	}

	.plate__link {
		display: block;
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

	.plate__frame img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.plate__play {
		position: absolute;
		bottom: 0.65rem;
		right: 0.65rem;
		left: auto;
		z-index: 2;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 9999px;
		border: none;
		background: var(--color-ink);
		color: var(--color-paper);
		display: grid;
		place-items: center;
		cursor: pointer;
		box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.35);
		transition: transform 150ms ease, opacity 150ms ease;
	}

	.plate__play:hover {
		transform: scale(1.06);
	}

	.plate__play--active {
		opacity: 0.9;
	}
</style>

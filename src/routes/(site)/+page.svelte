<script lang="ts">
	import { base } from '$app/paths';
	import { artist, drawings, tracks } from '$lib/content';
	import { playTrack, site, toggleHeroPlayback } from '$lib/site-state.svelte';
</script>

<svelte:head>
	<title>{artist.name}</title>
	<meta name="description" content={artist.tagline} />
</svelte:head>

<section class="gallery">
	<div class="gallery__intro">
		<p class="gallery__statement">
			Zes studies in grafiet. De werken worden in omgekeerde chronologische volgorde getoond — de
			meest recente eerst.
		</p>
		<p class="gallery__atelier">
			<a href="{base}/atelier/">Of bekijk alles verspreid op de werktafel →</a>
		</p>
	</div>

	<div class="gallery__listening" aria-label="Luister mee">
		<p class="gallery__listening-label">Luister mee</p>
		<div class="gallery__listening-row">
			<button
				type="button"
				class="gallery__play"
				onclick={toggleHeroPlayback}
				aria-label={site.isPlaying ? 'Pauzeer' : 'Begin met luisteren'}
			>
				{#if site.isPlaying}
					<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
						<rect x="6" y="5" width="4" height="14" />
						<rect x="14" y="5" width="4" height="14" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
						<path d="M7 5v14l12-7z" />
					</svg>
				{/if}
			</button>
			<ul class="gallery__tracks">
				{#each tracks as track, i (track.id)}
					<li>
						<button
							type="button"
							class="gallery__track"
							class:gallery__track--active={site.index === i}
							onclick={() => playTrack(i)}
						>
							{track.title}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<ul class="gallery__grid">
		{#each drawings as drawing (drawing.id)}
			<li class="gallery__item">
				<a class="plate" href="{base}/werk/{drawing.id}/">
					<div class="plate__frame">
						<img src={drawing.src} alt={drawing.alt} loading="lazy" />
					</div>
					<div class="plate__meta">
						<h2 class="plate__title">{drawing.title}</h2>
						<p class="plate__sub">{drawing.year} · {drawing.medium}</p>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</section>

<style>
	.gallery {
		padding: clamp(2rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3.5rem) 0;
		max-width: 80rem;
		margin: 0 auto;
	}

	.gallery__intro {
		max-width: 32rem;
		margin: 0 auto 2rem;
		text-align: center;
	}

	.gallery__statement {
		font-family: var(--font-museum);
		font-style: italic;
		font-size: 1.15rem;
		line-height: 1.55;
		color: var(--color-ink-soft);
		margin: 0;
	}

	.gallery__atelier {
		margin: 1.25rem 0 0;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.08em;
	}

	.gallery__atelier a {
		color: var(--color-ink-soft);
		text-decoration: none;
		opacity: 0.75;
		transition: opacity 200ms ease;
	}

	.gallery__atelier a:hover {
		opacity: 1;
	}

	.gallery__listening {
		max-width: 42rem;
		margin: 0 auto 3rem;
		text-align: center;
	}

	.gallery__listening-label {
		font-family: var(--font-sans);
		font-size: 0.68rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.55;
		margin: 0 0 0.65rem;
	}

	.gallery__listening-row {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem 0.35rem;
	}

	.gallery__play {
		flex: none;
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
		border: none;
		background: var(--color-ink);
		color: var(--color-paper);
		display: grid;
		place-items: center;
		cursor: pointer;
		transition: transform 150ms ease;
	}

	.gallery__play:hover {
		transform: scale(1.06);
	}

	.gallery__tracks {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.35rem;
	}

	.gallery__track {
		appearance: none;
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 9999px;
		cursor: pointer;
		padding: 0.35rem 0.85rem;
		font-family: var(--font-museum);
		font-style: italic;
		font-size: 0.88rem;
		color: var(--color-ink-soft);
		transition:
			color 150ms ease,
			border-color 150ms ease,
			background 150ms ease;
	}

	.gallery__track:hover {
		color: var(--color-ink);
		border-color: rgba(0, 0, 0, 0.22);
	}

	.gallery__track--active {
		color: var(--color-ink);
		background: var(--color-paper);
		border-color: rgba(0, 0, 0, 0.18);
	}

	.gallery__grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
		gap: clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem);
	}

	.gallery__item {
		margin: 0;
	}

	.plate {
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

	.plate__meta {
		margin-top: 1rem;
		text-align: center;
	}

	.plate__title {
		font-family: var(--font-museum);
		font-style: italic;
		font-weight: 400;
		font-size: 1.1rem;
		margin: 0;
	}

	.plate__sub {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.7;
		margin: 0.4rem 0 0;
	}
</style>

<script lang="ts">
	import { base } from '$app/paths';
	import { drawings, tracks } from '$lib/content';
	import { selectTrack, museum } from './museum-state.svelte';
</script>

<svelte:head>
	<title>Museum — V. Solenne</title>
</svelte:head>

<section class="gallery">
	<div class="gallery__intro">
		<p class="gallery__statement">
			Zes studies in grafiet. De werken worden in omgekeerde chronologische volgorde getoond — de
			meest recente eerst.
		</p>
	</div>

	<ul class="gallery__grid">
		{#each drawings as drawing (drawing.id)}
			<li class="gallery__item">
				<a class="plate" href="{base}/museum/{drawing.id}/">
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

	<aside class="gallery__listening">
		<p class="gallery__listening-label">Nu te horen</p>
		<ul>
			{#each tracks as track (track.id)}
				<li>
					<button
						type="button"
						class="gallery__track"
						class:gallery__track--active={museum.currentTrack.id === track.id}
						onclick={() => selectTrack(track)}
					>
						<span class="gallery__track-title">{track.title}</span>
						<span class="gallery__track-composer">{track.composer}</span>
					</button>
				</li>
			{/each}
		</ul>
	</aside>
</section>

<style>
	.gallery {
		padding: clamp(2rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3.5rem) 0;
		max-width: 80rem;
		margin: 0 auto;
	}

	.gallery__intro {
		max-width: 32rem;
		margin: 0 auto 4rem;
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

	.gallery__listening {
		margin: 5rem auto 2rem;
		max-width: 32rem;
		text-align: center;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		padding-top: 2.5rem;
	}

	.gallery__listening-label {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.6;
		margin: 0 0 1rem;
	}

	.gallery__listening ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.gallery__track {
		appearance: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem 1rem;
		font-family: var(--font-museum);
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		width: 100%;
		color: var(--color-ink-soft);
		transition: color 200ms ease;
	}

	.gallery__track:hover,
	.gallery__track--active {
		color: var(--color-ink);
	}

	.gallery__track--active::before {
		content: '▸';
		margin-right: 0.4em;
		opacity: 0.6;
	}

	.gallery__track-title {
		font-size: 1.05rem;
		font-style: italic;
	}

	.gallery__track-composer {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.7;
	}
</style>

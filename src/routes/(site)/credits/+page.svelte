<script lang="ts">
	import BackLink from '$lib/atelier/BackLink.svelte';
	import { artist, drawings } from '$lib/content';
</script>

<svelte:head>
	<title>Colofon — {artist.name}</title>
	<meta name="description" content="Credits en rechten" />
</svelte:head>

<article class="credits">
	<BackLink />

	<header class="credits__header">
		<h1 class="credits__artist">{artist.name}</h1>
		<p class="credits__lead">{artist.tagline}</p>
	</header>

	<section class="credits__section">
		<h2>Werken</h2>
		<ul class="credits__list">
			{#each drawings as drawing (drawing.id)}
				<li>
					<em>{drawing.title}</em>
					<span class="credits__meta">{drawing.year} · {drawing.medium}</span>
					{#if drawing.track}
						<span class="credits__meta">{drawing.track.composer}: {drawing.track.title}</span>
					{/if}
				</li>
			{/each}
		</ul>
		<p>
			Klassieke composities (Chopin, Beethoven, Brahms, …) zijn vrij van auteursrecht. Opnames
			© {artist.name}.
		</p>
	</section>

	<section class="credits__section">
  	<h2>Rechten</h2>
		<p>© 2023–2026 {artist.name}. Alle rechten voorbehouden.</p>
		<p>
			Persoonlijke site om te bekijken — geen bibliotheek. Tekeningen en opnames niet
			kopiëren of hergebruiken zonder schriftelijke toestemming.
		</p>
	</section>

	<section class="credits__section credits__section--last">
  	<h2>Bronnen</h2>
		<p>
			Francis Barraud, <em>His Master’s Voice</em> (1898) <br/>
      License: <a href="https://commons.wikimedia.org/wiki/File:His_Master%27s_Voice.jpg">Wikimedia Commons</a>
		</p>
		<p>
      45rpm needle drop.wav by Richard Frohlich (https://freesound.org/s/42819/) <br/>
      License: <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0</a>
		</p>
    <p>
      vinyl_record_needle_lift_01.wav by Joe DeShon (https://freesound.org/s/79578/) <br/>
      License: <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0</a>
    </p>
	</section>
</article>

<style>
	.credits {
		max-width: 36rem;
		margin: 0 auto;
		padding: clamp(1.5rem, 4vw, 3rem) max(1.25rem, env(safe-area-inset-left, 0px))
			clamp(2rem, 5vw, 4rem);
		font-family: var(--font-serif);
		font-size: 1.05rem;
		line-height: 1.65;
		color: var(--color-ink-soft);
	}

	.credits__header {
		margin-bottom: 2rem;
		text-align: center;
		padding-top: 0.25rem;
	}

	.credits__artist {
		font-family: var(--font-museum);
		font-size: clamp(1.35rem, 4vw, 1.65rem);
		font-weight: 400;
		letter-spacing: 0.04em;
		color: var(--color-ink);
		margin: 0 0 0.35rem;
	}

	.credits__lead {
		margin: 0;
	}

	.credits__section {
		margin-bottom: 2rem;
	}

	.credits__section h2 {
		font-family: var(--font-sans);
		font-size: 0.65rem;
		font-weight: 500;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-ink);
		margin: 0 0 0.75rem;
	}

	.credits__section p {
		margin: 0 0 0.75rem;
	}

	.credits__section--last {
		margin-bottom: 0;
	}

	.credits__section a {
		color: var(--color-ink-soft);
	}

	.credits__section a:hover {
		color: var(--color-ink);
	}

	.credits__list {
		list-style: none;
		padding: 0;
		margin: 0 0 0.75rem;
		display: grid;
		gap: 0.85rem;
	}

	.credits__list li {
		display: grid;
		gap: 0.15rem;
	}

	.credits__list em {
		font-family: var(--font-museum);
		font-style: italic;
		color: var(--color-ink);
	}

	.credits__meta {
		font-size: 0.9rem;
		opacity: 0.8;
	}
</style>

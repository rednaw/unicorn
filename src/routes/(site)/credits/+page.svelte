<script lang="ts">
	import { base } from '$app/paths';
	import { artist, drawings, tracks } from '$lib/content';

	const placeholderTracks = new Set(['chopin-polonaise']);
</script>

<svelte:head>
	<title>Colofon — {artist.name}</title>
	<meta name="description" content="Credits en rechten" />
</svelte:head>

<article class="credits">
	<header class="credits__header">
		<h1 class="credits__title">Colofon</h1>
		<p class="credits__lead">
			<strong>{artist.name}</strong> is een werknaam (pseudoniem) en kan nog wijzigen.
			De maker van de tekeningen en opnames op deze site is dezelfde persoon.
		</p>
	</header>

	<section class="credits__section">
		<h2>Rechten</h2>
		<p>
			© 2023–2026 de maker. Alle rechten voorbehouden.
		</p>
		<p>
			Dit is een persoonlijke site, bedoeld om te bekijken — geen bibliotheek en
			niet bedoeld om bestanden te delen of te hergebruiken. Tekeningen en
			opnames mogen niet worden gekopieerd, herpubliceerd of gebruikt zonder
			voorafgaande schriftelijke toestemming.
		</p>
		<p class="credits__note">De site is nog in aanbouw; sommige bestanden zijn tijdelijk.</p>
	</section>

	<section class="credits__section">
		<h2>Tekeningen</h2>
		<p>Origineel werk. Pre-scans (lage resolutie; definitieve scans volgen).</p>
		<ul class="credits__list">
			{#each drawings as drawing (drawing.id)}
				<li>
					<em>{drawing.title}</em>
					<span class="credits__meta">{drawing.year} · {drawing.medium}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="credits__section">
		<h2>Geluid</h2>
		<p>Composities van Chopin zijn vrij van auteursrecht. Opnames zijn afzonderlijke werken.</p>
		<ul class="credits__list">
			{#each tracks as track (track.id)}
				<li>
					<em>{track.title}</em>
					<span class="credits__meta">{track.composer}</span>
					{#if placeholderTracks.has(track.id)}
						<span class="credits__placeholder">tijdelijke placeholder (YouTube)</span>
					{:else}
						<span class="credits__meta">eigen opname</span>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<p class="credits__back">
		<a href="{base}/">← terug</a>
	</p>
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
	}

	.credits__title {
		font-family: var(--font-museum);
		font-size: clamp(1.5rem, 4vw, 1.85rem);
		font-weight: 400;
		font-style: italic;
		color: var(--color-ink);
		margin: 0 0 0.75rem;
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

	.credits__note {
		font-size: 0.95rem;
		opacity: 0.85;
	}

	.credits__list {
		list-style: none;
		padding: 0;
		margin: 0;
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

	.credits__placeholder {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		color: #6b5340;
	}

	.credits__back {
		margin: 2.5rem 0 0;
		font-family: var(--font-sans);
		font-size: 0.9rem;
	}

	.credits__back a {
		color: inherit;
		text-decoration: none;
		opacity: 0.7;
		transition: opacity 200ms ease;
	}

	.credits__back a:hover {
		opacity: 1;
	}
</style>

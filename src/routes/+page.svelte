<script lang="ts">
	import { base } from '$app/paths';
	import { artist, variants } from '$lib/content';
</script>

<svelte:head>
	<title>{artist.name} — vijf ontwerpvarianten</title>
	<meta name="description" content={artist.tagline} />
</svelte:head>

<main class="landing">
	<header class="landing__intro">
		<p class="landing__eyebrow">Een prototype</p>
		<h1 class="landing__title">{artist.name}</h1>
		<p class="landing__tagline">{artist.tagline}</p>
		<p class="landing__bio">{artist.bio}</p>
	</header>

	<section class="landing__variants" aria-label="Ontwerpvarianten">
		<p class="landing__variants-label">Vijf manieren om hetzelfde werk te zien</p>
		<ul class="landing__cards">
			{#each variants as variant (variant.slug)}
				<li class="card">
					<a class="card__link" href="{base}/{variant.slug}/">
						<span class="card__num">0{variants.indexOf(variant) + 1}</span>
						<h2 class="card__title">{variant.title}</h2>
						<p class="card__tagline">{variant.tagline}</p>
						<p class="card__rationale">{variant.rationale}</p>
						<span class="card__arrow" aria-hidden="true">→</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<footer class="landing__foot">
		<p>
			Placeholder-inhoud. Zie <code>/static/CREDITS.md</code> voor bronnen, en
			<code>src/lib/content.ts</code> om je eigen werk in te voegen.
		</p>
	</footer>
</main>

<style>
	.landing {
		max-width: 64rem;
		margin: 0 auto;
		padding: clamp(2rem, 6vw, 5rem) clamp(1.25rem, 4vw, 2.5rem) 4rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		gap: clamp(3rem, 8vw, 6rem);
	}

	.landing__intro {
		max-width: 38rem;
	}

	.landing__eyebrow {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.7;
		margin: 0 0 1.5rem;
	}

	.landing__title {
		font-family: var(--font-display);
		font-size: clamp(2.5rem, 7vw, 5rem);
		line-height: 1;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.landing__tagline {
		font-family: var(--font-serif);
		font-style: italic;
		font-size: clamp(1.05rem, 1.6vw, 1.25rem);
		margin: 1rem 0 2rem;
		color: var(--color-ink-soft);
	}

	.landing__bio {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		line-height: 1.65;
		color: var(--color-ink);
		max-width: 36rem;
	}

	.landing__variants {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.landing__variants-label {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.7;
		margin: 0;
	}

	.landing__cards {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		gap: 1px;
		background: rgba(0, 0, 0, 0.12);
		border: 1px solid rgba(0, 0, 0, 0.12);
	}

	.card {
		background: var(--color-wall);
		transition: background 200ms ease;
	}

	.card:hover {
		background: var(--color-paper);
	}

	.card__link {
		display: grid;
		grid-template-areas:
			'num arrow'
			'title title'
			'tag tag'
			'rationale rationale';
		grid-template-columns: 1fr auto;
		gap: 0.5rem 1rem;
		padding: 1.75rem 1.5rem 1.5rem;
		color: inherit;
		text-decoration: none;
		min-height: 14rem;
	}

	.card__num {
		grid-area: num;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		font-feature-settings: 'tnum';
		color: var(--color-ink-soft);
		opacity: 0.7;
	}

	.card__title {
		grid-area: title;
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 400;
		margin: 0;
		line-height: 1;
		letter-spacing: -0.01em;
	}

	.card__tagline {
		grid-area: tag;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 1rem;
		margin: 0;
		color: var(--color-ink-soft);
	}

	.card__rationale {
		grid-area: rationale;
		font-family: var(--font-sans);
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--color-ink);
		margin: 0.75rem 0 0;
		align-self: end;
	}

	.card__arrow {
		grid-area: arrow;
		font-family: var(--font-sans);
		font-size: 1.25rem;
		color: var(--color-ink-soft);
		transition: transform 200ms ease;
	}

	.card:hover .card__arrow {
		transform: translateX(4px);
	}

	.landing__foot {
		margin-top: auto;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		color: var(--color-ink-soft);
		opacity: 0.7;
	}

	.landing__foot code {
		font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace;
		font-size: 0.78em;
		background: rgba(0, 0, 0, 0.06);
		padding: 0.1em 0.4em;
		border-radius: 3px;
	}
</style>

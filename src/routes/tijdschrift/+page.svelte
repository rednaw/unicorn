<script lang="ts">
	import { base } from '$app/paths';
	import { artist, drawings, poems, tracks } from '$lib/content';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import BackLink from '$lib/components/BackLink.svelte';

	// Pair each drawing with its companion poem (if any) and rotate through tracks.
	const spreads = drawings.map((drawing, i) => ({
		drawing,
		poem: poems.find((p) => p.pairsWith === drawing.id),
		track: tracks[i % tracks.length]
	}));
</script>

<svelte:head>
	<title>Tijdschrift — V. Solenne</title>
</svelte:head>

<div class="ed">
	<BackLink theme="light" />

	<header class="ed__masthead">
		<div class="ed__mast-meta">
			<span>Nr. 01</span>
			<span>Voorjaar 2026</span>
		</div>
		<h1 class="ed__masthead-title">Solenne Kwartaalblad</h1>
		<p class="ed__masthead-sub">Een monografie van tekeningen, muziek en verzen</p>
		<hr class="ed__rule" />
	</header>

	<section class="ed__lead">
		<p class="ed__byline">Door de redactie · {artist.name}</p>
		<h2 class="ed__lead-title">Zes studies in een stille hand</h2>
		<div class="ed__lead-body">
			<p class="ed__dropcap">
				Er is een bepaalde aandacht nodig om vóór het papier te gaan zitten en een lijn zichzelf te
				laten vinden. De tekeningen die hier verzameld zijn werden gemaakt in een periode van enkele
				weken, in slecht licht, in een kamer zonder klok. Elk wachtte op zijn gedicht, en verscheidene
				wachten nog steeds.
			</p>
			<p>
				Dit nummer toont ze zoals ze kwamen: in de volgorde van de dagen. De begeleidende muziek —
				Rachmaninov, Liszt, Chopin — klonk op de oude piano in de kamer terwijl de tekeningen
				ontstonden.
			</p>
		</div>
	</section>

	{#each spreads as { drawing, poem, track }, i (drawing.id)}
		<article class="spread spread--{i % 3}" data-index={i + 1}>
			<figure class="spread__plate">
				<img src={drawing.src} alt={drawing.alt} loading="lazy" />
				<figcaption>
					<span class="spread__plate-num">Plaat {String(i + 1).padStart(2, '0')}</span>
					<span class="spread__plate-title">{drawing.title}</span>
					<span class="spread__plate-meta">{drawing.year} · {drawing.medium}</span>
				</figcaption>
			</figure>

			<div class="spread__text">
				{#if poem}
					<h3 class="spread__poem-title">{poem.title}</h3>
					<div class="spread__poem">
						{#each poem.lines as line, li (li)}
							{#if line === ''}
								<div class="spread__break"></div>
							{:else if li === 0}
								<p class="spread__poem-first">{line}</p>
							{:else}
								<p>{line}</p>
							{/if}
						{/each}
						<p class="spread__poem-author">— {poem.author}</p>
					</div>

					{#if poem.lines[0]}
						<blockquote class="spread__pullquote">
							{poem.lines.find((l) => l.length > 18 && l.length < 60) ?? poem.lines[0]}
						</blockquote>
					{/if}
				{:else}
					<h3 class="spread__poem-title">Een aantekening bij deze plaat</h3>
					<div class="spread__poem">
						<p class="spread__poem-first">
							Deze studie heeft geen begeleidende tekst. Ze is hier opgenomen als tegenwicht — een
							tekening die zich verzet tegen elke verklaring, zelfs tegen zichzelf.
						</p>
					</div>
				{/if}

				<aside class="spread__footnote">
					<p class="spread__footnote-label">In de kamer, op de piano</p>
					<AudioPlayer {track} variant="inline" />
				</aside>
			</div>
		</article>
	{/each}

	<footer class="ed__colophon">
		<hr class="ed__rule" />
		<p>
			Gezet in <em>DM Serif Display</em>, <em>EB Garamond</em> en <em>Inter</em>. Gedrukt —
			naar verluidt — in het atelier.
		</p>
		<p>Nummer 01</p>
	</footer>
</div>

<style>
	.ed {
		background: #f6f3eb;
		color: #1a1814;
		font-family: var(--font-serif);
		min-height: 100vh;
		padding: clamp(2rem, 5vw, 4rem) 0 4rem;
	}

	.ed__masthead,
	.ed__lead,
	.ed__colophon {
		max-width: 64rem;
		margin: 0 auto;
		padding: 0 clamp(1.5rem, 5vw, 4rem);
	}

	.ed__masthead {
		text-align: center;
		position: relative;
		/* Leave room under the fixed BackLink pill so the masthead meta line clears it. */
		padding-top: 3.5rem;
	}

	.ed__mast-meta {
		display: flex;
		justify-content: space-between;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.6;
	}

	.ed__masthead-title {
		font-family: var(--font-display);
		font-size: clamp(2.5rem, 6vw, 4.5rem);
		font-weight: 400;
		line-height: 1;
		margin: 1.5rem 0 0.75rem;
		letter-spacing: -0.01em;
	}

	.ed__masthead-sub {
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 1.05rem;
		color: var(--color-ink-soft);
		margin: 0 0 2rem;
	}

	.ed__rule {
		border: none;
		border-top: 1px solid var(--color-ink-soft);
		opacity: 0.3;
		margin: 0;
	}

	.ed__lead {
		margin: 4rem auto 6rem;
		max-width: 44rem;
	}

	.ed__byline {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.7;
		margin: 0 0 0.5rem;
	}

	.ed__lead-title {
		font-family: var(--font-display);
		font-size: clamp(1.75rem, 3.5vw, 2.75rem);
		font-weight: 400;
		font-style: italic;
		line-height: 1.05;
		margin: 0 0 2rem;
	}

	.ed__lead-body {
		columns: 2;
		column-gap: 2.5rem;
		font-size: 1.05rem;
		line-height: 1.65;
	}

	@media (max-width: 640px) {
		.ed__lead-body {
			columns: 1;
		}
	}

	.ed__lead-body p {
		margin: 0 0 1rem;
		break-inside: avoid;
	}

	.ed__dropcap::first-letter {
		font-family: var(--font-display);
		font-size: 4.5em;
		float: left;
		line-height: 0.85;
		padding-right: 0.06em;
		padding-top: 0.04em;
		font-style: italic;
	}

	/* SPREADS */

	.spread {
		max-width: 80rem;
		margin: 6rem auto;
		padding: 0 clamp(1.5rem, 5vw, 4rem);
		display: grid;
		gap: clamp(2rem, 4vw, 4rem);
		align-items: start;
	}

	/* Layout A: image left, text right */
	.spread--0 {
		grid-template-columns: minmax(0, 5fr) minmax(0, 4fr);
	}

	/* Layout B: text left, image right */
	.spread--1 {
		grid-template-columns: minmax(0, 4fr) minmax(0, 5fr);
	}

	.spread--1 .spread__plate {
		order: 2;
	}

	.spread--1 .spread__text {
		order: 1;
	}

	/* Layout C: full-bleed image stacked above text */
	.spread--2 {
		grid-template-columns: 1fr;
	}

	.spread--2 .spread__plate {
		max-width: 64rem;
		margin: 0 auto;
	}

	.spread--2 .spread__text {
		max-width: 44rem;
		margin: 0 auto;
		columns: 2;
		column-gap: 2.5rem;
	}

	@media (max-width: 900px) {
		.spread--0,
		.spread--1 {
			grid-template-columns: 1fr;
		}

		.spread--1 .spread__plate {
			order: 0;
		}

		.spread--1 .spread__text {
			order: 0;
		}

		.spread--2 .spread__text {
			columns: 1;
		}
	}

	.spread__plate {
		margin: 0;
		background: #efe9da;
		padding: clamp(1rem, 3vw, 2rem);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.spread__plate img {
		display: block;
		width: 100%;
		height: auto;
	}

	.spread__plate figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		color: var(--color-ink-soft);
		letter-spacing: 0.04em;
	}

	.spread__plate-num {
		text-transform: uppercase;
		letter-spacing: 0.2em;
		opacity: 0.7;
	}

	.spread__plate-title {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.1rem;
		color: var(--color-ink);
		text-transform: none;
		letter-spacing: 0;
	}

	.spread__plate-meta {
		opacity: 0.7;
		text-transform: uppercase;
		letter-spacing: 0.16em;
	}

	.spread__text {
		break-inside: avoid;
	}

	.spread__poem-title {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		line-height: 1.05;
		margin: 0 0 1.5rem;
	}

	.spread__poem p {
		margin: 0;
		font-size: 1.08rem;
		line-height: 1.55;
	}

	.spread__poem-first::first-letter {
		font-family: var(--font-display);
		font-size: 3.2em;
		float: left;
		line-height: 0.85;
		padding-right: 0.08em;
		padding-top: 0.05em;
		font-style: italic;
	}

	.spread__break {
		height: 0.8em;
	}

	.spread__poem-author {
		margin-top: 1.2rem !important;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.7;
	}

	.spread__pullquote {
		font-family: var(--font-display);
		font-style: italic;
		font-size: clamp(1.25rem, 2vw, 1.6rem);
		line-height: 1.3;
		color: var(--color-ink);
		border-left: 2px solid var(--color-ink);
		padding: 0.5rem 0 0.5rem 1.25rem;
		margin: 2rem 0;
		max-width: 28rem;
	}

	.spread__footnote {
		margin-top: 2rem;
		padding: 1rem 0;
		border-top: 1px solid rgba(0, 0, 0, 0.15);
		border-bottom: 1px solid rgba(0, 0, 0, 0.15);
	}

	.spread__footnote-label {
		font-family: var(--font-sans);
		font-size: 0.68rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.7;
		margin: 0 0 0.5rem;
	}

	.ed__colophon {
		text-align: center;
		margin-top: 6rem;
		max-width: 36rem;
	}

	.ed__colophon p {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		color: var(--color-ink-soft);
		margin: 1rem 0 0;
	}

	.ed__colophon em {
		font-family: var(--font-serif);
		font-style: italic;
	}
</style>

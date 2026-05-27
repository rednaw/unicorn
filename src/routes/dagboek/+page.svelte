<script lang="ts">
	import { artist, drawings, entries, tracks } from '$lib/content';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import BackLink from '$lib/components/BackLink.svelte';

	// Reverse-chronological: most recent entry on top.
	const ordered = [...entries].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

	const drawingById = Object.fromEntries(drawings.map((d) => [d.id, d]));
	const trackById = Object.fromEntries(tracks.map((t) => [t.id, t]));
</script>

<svelte:head>
	<title>Dagboek — V. Solenne</title>
</svelte:head>

<div class="diary">
	<BackLink theme="light" />

	<header class="diary__head">
		<p class="diary__eyebrow">Aantekeningen</p>
		<h1 class="diary__title">{artist.name}</h1>
		<p class="diary__sub">
			Voorjaar — bladzijden uit een werkschrift, achterstevoren gelezen
		</p>
	</header>

	<ol class="diary__entries">
		{#each ordered as entry (entry.id)}
			{@const blank = !entry.body && !entry.drawingIds?.length && !entry.trackId}
			<li
				class="entry"
				class:entry--blank={blank}
				style:--rot="{entry.rotation ?? 0}deg"
			>
				<span class="entry__date">{entry.dateLabel}</span>

				{#if blank}
					<p class="entry__bare" aria-label="geen aantekening">—</p>
				{:else}
					{#if entry.body}
						{#each entry.body.split('\n\n') as paragraph, pi (pi)}
							<p class="entry__body">{paragraph}</p>
						{/each}
					{/if}

					{#if entry.drawingIds?.length}
						<div class="entry__plates">
							{#each entry.drawingIds as did, di (did)}
								{@const drawing = drawingById[did]}
								{#if drawing}
									<figure class="polaroid" style:--tilt="{di % 2 === 0 ? -1.6 : 1.4}deg">
										<div class="polaroid__inner">
											<img src={drawing.src} alt={drawing.alt} />
										</div>
										{#if di === 0 && entry.drawingCaption}
											<figcaption class="polaroid__caption">
												{entry.drawingCaption}
											</figcaption>
										{:else}
											<figcaption class="polaroid__caption polaroid__caption--small">
												{drawing.title.toLowerCase()}
											</figcaption>
										{/if}
									</figure>
								{/if}
							{/each}
						</div>
					{/if}

					{#if entry.poemFragment}
						<aside class="fragment">
							{#each entry.poemFragment.lines as line, li (li)}
								<p>{line}</p>
							{/each}
							{#if entry.poemFragment.author}
								<p class="fragment__attr">— {entry.poemFragment.author}</p>
							{/if}
						</aside>
					{/if}

					{#if entry.trackId && trackById[entry.trackId]}
						<div class="listen">
							<span class="listen__label">Luister —</span>
							<AudioPlayer track={trackById[entry.trackId]} variant="minimal" class="listen__player" />
						</div>
					{/if}
				{/if}
			</li>
		{/each}
	</ol>

	<footer class="diary__foot">
		<p>— hier eindigt het schrift —</p>
	</footer>
</div>

<style>
	/* The diary's distinctive typography (Caveat handwriting + Special Elite
	   typewriter) is referenced via custom properties so we can re-use them
	   inside this component without depending on the Tailwind @theme indirection. */
	.diary {
		--diary-hand: 'Caveat', cursive;
		--diary-stamp: 'Special Elite', ui-monospace, 'Courier New', monospace;
		min-height: 100vh;
		background:
			radial-gradient(circle at 18% 22%, rgba(120, 88, 48, 0.05), transparent 55%),
			radial-gradient(circle at 82% 76%, rgba(120, 88, 48, 0.04), transparent 60%),
			radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.45), transparent 70%),
			#f3ead4;
		color: #1f1a12;
		padding: 4rem clamp(1rem, 5vw, 3rem) 6rem;
		font-family: var(--diary-hand);
	}

	.diary__head {
		max-width: 38rem;
		margin: 0 auto 3rem;
		text-align: center;
	}

	.diary__eyebrow {
		font-family: var(--diary-stamp);
		font-size: 0.78rem;
		letter-spacing: 0.32em;
		text-transform: uppercase;
		color: #5a4a30;
		margin: 0;
	}

	.diary__title {
		font-family: var(--font-display);
		font-size: clamp(2.6rem, 6vw, 4rem);
		font-weight: 400;
		font-style: italic;
		margin: 0.4rem 0 0.5rem;
	}

	.diary__sub {
		font-family: var(--diary-hand);
		font-size: 1.35rem;
		color: #4d3f29;
		margin: 0;
	}

	.diary__entries {
		max-width: 38rem;
		margin: 0 auto;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 5rem;
	}

	.entry {
		position: relative;
		padding: 1rem 0;
		transform: rotate(var(--rot, 0deg));
	}

	.entry--blank {
		min-height: 4rem;
		opacity: 0.65;
	}

	.entry__date {
		position: absolute;
		top: -0.5rem;
		right: 0;
		font-family: var(--diary-stamp);
		font-size: 0.82rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #5a4a30;
		background: rgba(243, 234, 212, 0.6);
		padding: 0.2rem 0.4rem;
	}

	.entry__body {
		font-family: var(--diary-hand);
		font-size: 1.55rem;
		line-height: 1.45;
		color: #1f1a12;
		margin: 0 0 1rem;
		white-space: pre-line;
	}

	.entry__body + .entry__body {
		margin-top: 1rem;
	}

	.entry__bare {
		font-family: var(--diary-hand);
		font-size: 1.6rem;
		color: #6b5a3e;
		margin: 0;
	}

	/* Polaroid plate. Images are the centre of each entry. */
	.entry__plates {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		justify-content: center;
		margin: 1.5rem 0 0.5rem;
	}

	.polaroid {
		position: relative;
		background: #fbf6e6;
		padding: 12px 12px 0;
		box-shadow:
			0 22px 36px -22px rgba(60, 40, 12, 0.45),
			0 4px 10px -3px rgba(60, 40, 12, 0.2);
		transform: rotate(var(--tilt, 0deg));
		max-width: min(420px, 92%);
		margin: 0;
	}

	/* Masking-tape strips, top corners. */
	.polaroid::before,
	.polaroid::after {
		content: '';
		position: absolute;
		top: -10px;
		width: 72px;
		height: 18px;
		background: rgba(228, 196, 125, 0.65);
		box-shadow: inset 0 0 0 1px rgba(120, 90, 30, 0.18);
		filter: blur(0.2px);
	}

	.polaroid::before {
		left: -14px;
		transform: rotate(-7deg);
	}

	.polaroid::after {
		right: -14px;
		transform: rotate(5deg);
	}

	.polaroid__inner {
		background: #fdf9eb;
		overflow: hidden;
	}

	.polaroid__inner img {
		display: block;
		width: 100%;
		height: auto;
		mix-blend-mode: multiply;
	}

	.polaroid__caption {
		font-family: var(--diary-hand);
		font-size: 1.3rem;
		text-align: center;
		color: #2a2218;
		padding: 0.85rem 0.5rem 1.1rem;
		margin: 0;
	}

	.polaroid__caption--small {
		font-size: 1.05rem;
		opacity: 0.75;
	}

	/* Pasted-in poem fragment. Small, off-axis, second hand. */
	.fragment {
		margin: 1.75rem 0 0;
		padding: 0.85rem 1.1rem;
		max-width: 22rem;
		background: rgba(253, 246, 220, 0.85);
		border-left: 2px solid rgba(60, 40, 12, 0.25);
		transform: rotate(-1.2deg);
		box-shadow: 0 8px 22px -16px rgba(60, 40, 12, 0.35);
		font-family: var(--font-serif);
		font-style: italic;
		color: #2c241a;
	}

	.fragment p {
		margin: 0;
		font-size: 0.98rem;
		line-height: 1.45;
	}

	.fragment__attr {
		margin-top: 0.3rem !important;
		font-family: var(--font-sans);
		font-style: normal;
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #5a4a30;
		opacity: 0.75;
	}

	/* "Luister" pill — gives the music card visual weight to match the polaroid. */
	.listen {
		margin: 1.5rem 0 0;
		padding: 0.65rem 0.9rem 0.65rem 1rem;
		background: rgba(28, 22, 14, 0.92);
		color: #f3ead4;
		border-radius: 9999px;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		max-width: 100%;
		box-shadow: 0 14px 28px -18px rgba(0, 0, 0, 0.55);
		font-family: var(--diary-stamp);
	}

	.listen__label {
		font-size: 0.7rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		opacity: 0.85;
		flex: none;
	}

	/* Restyle AudioPlayer's internals when used inside the listen pill. */
	.listen :global(.listen__player) {
		gap: 0.6rem;
		color: #f3ead4;
		font-family: var(--font-serif);
		min-width: 0;
	}

	.listen :global(.listen__player .player__btn) {
		background: #f3ead4;
		color: #1c160e;
		width: 2rem;
		height: 2rem;
	}

	.listen :global(.listen__player .player__title) {
		font-size: 0.95rem;
		font-style: italic;
	}

	.listen :global(.listen__player .player__composer) {
		opacity: 0.7;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
	}

	.diary__foot {
		margin: 6rem auto 0;
		text-align: center;
		font-family: var(--diary-hand);
		font-size: 1.1rem;
		color: #5a4a30;
		opacity: 0.7;
	}

	@media (max-width: 480px) {
		.entry__body {
			font-size: 1.4rem;
		}
		.diary__entries {
			gap: 4rem;
		}
	}
</style>

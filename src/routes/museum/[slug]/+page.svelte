<script lang="ts">
	import { base } from '$app/paths';
	import { drawings, poems } from '$lib/content';
	import PoemBlock from '$lib/components/PoemBlock.svelte';

	let { data } = $props();
	const drawing = $derived(data.drawing);

	const pairedPoem = $derived(poems.find((p) => p.pairsWith === drawing.id));

	const currentIndex = $derived(drawings.findIndex((d) => d.id === drawing.id));
	const prev = $derived(drawings[(currentIndex - 1 + drawings.length) % drawings.length]);
	const next = $derived(drawings[(currentIndex + 1) % drawings.length]);
</script>

<svelte:head>
	<title>{drawing.title} — V. Solenne</title>
</svelte:head>

<article class="detail">
	<div class="detail__back">
		<a href="{base}/museum/">← Alle werken</a>
	</div>

	<div class="detail__plate">
		<img src={drawing.src} alt={drawing.alt} />
	</div>

	<header class="detail__meta">
		<h2 class="detail__title">{drawing.title}</h2>
		<p class="detail__sub">{drawing.year} · {drawing.medium}</p>
	</header>

	{#if pairedPoem}
		<div class="detail__pairing">
			<p class="detail__pairing-label">Begeleidende tekst</p>
			<PoemBlock poem={pairedPoem} />
		</div>
	{/if}

	<nav class="detail__pager">
		<a href="{base}/museum/{prev.id}/">
			<span class="detail__pager-arrow">←</span>
			<span class="detail__pager-meta">
				<span class="detail__pager-eyebrow">Vorige</span>
				<span class="detail__pager-title">{prev.title}</span>
			</span>
		</a>
		<a href="{base}/museum/{next.id}/" class="detail__pager-next">
			<span class="detail__pager-meta">
				<span class="detail__pager-eyebrow">Volgende</span>
				<span class="detail__pager-title">{next.title}</span>
			</span>
			<span class="detail__pager-arrow">→</span>
		</a>
	</nav>
</article>

<style>
	.detail {
		max-width: 56rem;
		margin: 0 auto;
		padding: clamp(2rem, 6vw, 4rem) clamp(1.5rem, 5vw, 3.5rem) 0;
	}

	.detail__back {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		margin-bottom: 2.5rem;
	}

	.detail__back a {
		color: var(--color-ink-soft);
		text-decoration: none;
		opacity: 0.7;
		transition: opacity 200ms ease;
	}

	.detail__back a:hover {
		opacity: 1;
	}

	.detail__plate {
		background: var(--color-paper);
		padding: clamp(1.5rem, 4vw, 3rem);
		display: grid;
		place-items: center;
		max-height: 70vh;
	}

	.detail__plate img {
		max-width: 100%;
		max-height: 70vh;
		object-fit: contain;
	}

	.detail__meta {
		text-align: center;
		margin-top: 2rem;
	}

	.detail__title {
		font-family: var(--font-museum);
		font-style: italic;
		font-weight: 400;
		font-size: clamp(1.5rem, 3vw, 2.25rem);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.detail__sub {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.7;
		margin: 0.6rem 0 0;
	}

	.detail__pairing {
		margin: 4rem auto;
		max-width: 32rem;
		text-align: center;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		padding-top: 2.5rem;
	}

	.detail__pairing :global(.poem) {
		margin: 0 auto;
	}

	.detail__pairing-label {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.6;
		margin: 0 0 1.5rem;
	}

	.detail__pager {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
	}

	.detail__pager a {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: var(--color-ink-soft);
		text-decoration: none;
		max-width: 18rem;
		transition: color 200ms ease;
	}

	.detail__pager a:hover {
		color: var(--color-ink);
	}

	.detail__pager-next {
		text-align: right;
	}

	.detail__pager-meta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	.detail__pager-eyebrow {
		font-family: var(--font-sans);
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.6;
	}

	.detail__pager-title {
		font-family: var(--font-museum);
		font-style: italic;
		font-size: 1rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.detail__pager-arrow {
		font-size: 1.25rem;
	}
</style>

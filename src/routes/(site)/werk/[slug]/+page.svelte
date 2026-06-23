<script lang="ts">
	import { base } from '$app/paths';
	import { artist, drawings } from '$lib/content';

	let { data } = $props();
	const drawing = $derived(data.drawing);

	const currentIndex = $derived(drawings.findIndex((d) => d.id === drawing.id));
	const prev = $derived(drawings[(currentIndex - 1 + drawings.length) % drawings.length]);
	const next = $derived(drawings[(currentIndex + 1) % drawings.length]);
</script>

<svelte:head>
	<title>{drawing.title} — {artist.name}</title>
</svelte:head>

<article class="detail">
	<div class="detail__back">
		<a href="{base}/">←</a>
	</div>

	<div class="detail__plate">
		<img src={drawing.src} alt={drawing.alt} style:view-transition-name="piece-{drawing.id}" />
	</div>

	<header class="detail__meta">
		<h2 class="detail__title">{drawing.title}</h2>
		<p class="detail__sub">{drawing.year} · {drawing.medium}</p>
	</header>

	<p class="detail__links">
		<a href="{base}/atelier/?focus={drawing.id}">Werktafel</a>
	</p>

	<nav class="detail__pager" aria-label="Werken">
		<a href="{base}/werk/{prev.id}/" aria-label="Vorig werk: {prev.title}">
			<span class="detail__pager-arrow">←</span>
		</a>
		<a href="{base}/werk/{next.id}/" aria-label="Volgend werk: {next.title}">
			<span class="detail__pager-arrow">→</span>
		</a>
	</nav>
</article>

<style>
	.detail {
		max-width: 56rem;
		margin: 0 auto;
		padding: clamp(2rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 3.5rem) 0;
		padding-inline: max(1.25rem, env(safe-area-inset-left, 0px))
			max(1.25rem, env(safe-area-inset-right, 0px));
	}

	.detail__back {
		font-family: var(--font-sans);
		font-size: 1.1rem;
		margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
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
		padding: clamp(1.75rem, 5vw, 3.5rem);
		display: grid;
		place-items: center;
		max-height: min(75vh, 52rem);
		margin-bottom: 0;
	}

	.detail__plate img {
		max-width: 100%;
		max-height: 75vh;
		object-fit: contain;
	}

	.detail__meta {
		text-align: center;
		margin-top: 2.5rem;
	}

	@media (min-width: 640px) {
		.detail__meta {
			margin-top: clamp(4.5rem, 7vw, 7rem);
		}
	}

	.detail__title {
		font-family: var(--font-museum);
		font-style: italic;
		font-weight: 400;
		font-size: clamp(1.25rem, 2.5vw, 1.75rem);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.detail__sub {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.65;
		margin: 0.85rem 0 0;
	}

	.detail__links {
		text-align: center;
		margin: clamp(2rem, 4vw, 2.75rem) 0 0;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.detail__links a {
		color: var(--color-ink-soft);
		text-decoration: none;
		opacity: 0.7;
		transition: opacity 200ms ease;
	}

	.detail__links a:hover {
		opacity: 1;
	}

	.detail__pager {
		display: flex;
		justify-content: space-between;
		margin-top: clamp(3rem, 6vw, 4.5rem);
		padding-top: clamp(1.5rem, 3vw, 2rem);
		border-top: 1px solid rgba(0, 0, 0, 0.08);
	}

	.detail__pager a {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		color: var(--color-ink-soft);
		text-decoration: none;
		transition: color 200ms ease;
	}

	.detail__pager a:hover {
		color: var(--color-ink);
	}

	.detail__pager-arrow {
		font-size: 1.25rem;
	}
</style>

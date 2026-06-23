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
	<nav class="detail__stage" aria-label="Werken">
		<a
			class="detail__nav detail__nav--prev"
			href="{base}/werk/{prev.id}/"
			aria-label="Vorig werk: {prev.title}"
		>
			<span class="detail__nav-arrow" aria-hidden="true">←</span>
		</a>

		<a
			class="detail__plate"
			href="{base}/atelier/?focus={drawing.id}"
			aria-label="Bekijk op de werktafel: {drawing.title}"
		>
			<img src={drawing.src} alt={drawing.alt} style:view-transition-name="piece-{drawing.id}" />
		</a>

		<a
			class="detail__nav detail__nav--next"
			href="{base}/werk/{next.id}/"
			aria-label="Volgend werk: {next.title}"
		>
			<span class="detail__nav-arrow" aria-hidden="true">→</span>
		</a>
	</nav>

	<header class="detail__meta">
		<h2 class="detail__title">{drawing.title}</h2>
		<p class="detail__sub">{drawing.year} · {drawing.medium}</p>
	</header>
</article>

<style>
	.detail {
		max-width: 56rem;
		margin: 0 auto;
		padding: clamp(2rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 3.5rem) 0;
		padding-inline: max(1.25rem, env(safe-area-inset-left, 0px))
			max(1.25rem, env(safe-area-inset-right, 0px));
	}

	.detail__stage {
		position: relative;
	}

	.detail__plate {
		background: var(--color-paper);
		padding: clamp(1.75rem, 5vw, 3.5rem);
		display: grid;
		place-items: center;
		max-height: min(75vh, 52rem);
		width: 100%;
		color: inherit;
		text-decoration: none;
		cursor: pointer;
		transition: box-shadow 300ms ease, transform 300ms ease;
	}

	.detail__plate:hover,
	.detail__plate:focus-visible {
		box-shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.2);
		transform: translateY(-2px);
		outline: none;
	}

	.detail__plate img {
		max-width: 100%;
		max-height: 75vh;
		object-fit: contain;
		pointer-events: none;
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

	.detail__nav {
		position: absolute;
		top: 50%;
		z-index: 2;
		display: grid;
		place-items: center;
		width: clamp(2.25rem, 6vw, 2.75rem);
		height: clamp(2.25rem, 6vw, 2.75rem);
		color: var(--color-ink-soft);
		text-decoration: none;
		border-radius: 9999px;
		background: rgba(251, 250, 246, 0.88);
		border: 1px solid rgba(0, 0, 0, 0.08);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		box-shadow: 0 4px 16px -8px rgba(0, 0, 0, 0.2);
		transition: color 200ms ease, background 200ms ease, transform 200ms ease;
	}

	.detail__nav--prev {
		left: 0;
		transform: translate(-40%, -50%);
	}

	.detail__nav--next {
		right: 0;
		transform: translate(40%, -50%);
	}

	.detail__nav:hover,
	.detail__nav:focus-visible {
		color: var(--color-ink);
		background: rgba(255, 255, 255, 0.96);
		outline: none;
	}

	.detail__nav--prev:hover,
	.detail__nav--prev:focus-visible {
		transform: translate(-40%, -50%) scale(1.05);
	}

	.detail__nav--next:hover,
	.detail__nav--next:focus-visible {
		transform: translate(40%, -50%) scale(1.05);
	}

	@media (max-width: 480px) {
		.detail__nav--prev {
			left: 0.35rem;
			transform: translateY(-50%);
		}

		.detail__nav--next {
			right: 0.35rem;
			transform: translateY(-50%);
		}

		.detail__nav--prev:hover,
		.detail__nav--prev:focus-visible,
		.detail__nav--next:hover,
		.detail__nav--next:focus-visible {
			transform: translateY(-50%) scale(1.05);
		}
	}

	.detail__nav-arrow {
		font-size: clamp(1.1rem, 3vw, 1.35rem);
		line-height: 1;
	}
</style>

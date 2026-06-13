<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import BackLink from '$lib/components/BackLink.svelte';
	import { artist } from '$lib/content';
	import { site } from '$lib/site-state.svelte';

	let { children } = $props();

	const isHome = $derived(page.url.pathname === `${base}/` || page.url.pathname === base);
</script>

<div class="site">
	<header class="site__header">
		{#if isHome}
			<div class="site__header-spacer" aria-hidden="true"></div>
		{:else}
			<BackLink theme="light" fixed={false} label="Galerij" />
		{/if}
		<div class="site__brand">
			<p class="site__brand-eyebrow">Tekeningen & geluid</p>
			<h1 class="site__brand-title">
				<a href="{base}/">{artist.name}</a>
			</h1>
		</div>
		<nav class="site__nav" aria-label="Hoofdnavigatie">
			<a href="{base}/" class:site__nav-link--active={isHome}>Galerij</a>
			<a href="{base}/atelier/">Atelier</a>
		</nav>
	</header>

	<main class="site__main">
		{@render children()}
	</main>

	<AudioPlayer track={site.currentTrack} variant="docked" />
</div>

<style>
	.site {
		background: #fbfaf6;
		color: #1d1a16;
		min-height: 100vh;
		font-family: var(--font-museum);
	}

	.site__header {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1.5rem;
		padding: 1.5rem clamp(1.5rem, 5vw, 3.5rem);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	.site__header-spacer {
		width: 7rem;
	}

	.site__brand {
		text-align: center;
	}

	.site__brand-eyebrow {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.6;
		margin: 0;
	}

	.site__brand-title {
		font-family: var(--font-museum);
		font-size: 1.5rem;
		font-weight: 400;
		font-style: italic;
		margin: 0.15rem 0 0;
	}

	.site__brand-title a {
		color: inherit;
		text-decoration: none;
	}

	.site__nav {
		display: flex;
		gap: 1.25rem;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.site__nav a {
		color: var(--color-ink-soft);
		text-decoration: none;
		opacity: 0.7;
		transition: opacity 200ms ease, color 200ms ease;
	}

	.site__nav a:hover,
	.site__nav-link--active {
		opacity: 1;
		color: var(--color-ink);
	}

	.site__main {
		padding-bottom: 8rem;
	}
</style>

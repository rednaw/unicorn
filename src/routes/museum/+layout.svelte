<script lang="ts">
	import { base } from '$app/paths';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import BackLink from '$lib/components/BackLink.svelte';
	import { artist } from '$lib/content';
	import { museum } from './museum-state.svelte';

	let { children } = $props();
</script>

<div class="museum">
	<header class="museum__header">
		<BackLink theme="light" fixed={false} />
		<div class="museum__brand">
			<p class="museum__brand-eyebrow">Een retrospectief</p>
			<h1 class="museum__brand-title">{artist.name}</h1>
		</div>
		<nav class="museum__nav">
			<a href="{base}/museum/">Galerij</a>
		</nav>
	</header>

	<main class="museum__main">
		{@render children()}
	</main>

	<AudioPlayer track={museum.currentTrack} variant="docked" />
</div>

<style>
	.museum {
		background: #fbfaf6;
		color: #1d1a16;
		min-height: 100vh;
		font-family: var(--font-museum);
	}

	.museum__header {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1.5rem;
		padding: 1.5rem clamp(1.5rem, 5vw, 3.5rem);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	.museum__brand {
		text-align: center;
	}

	.museum__brand-eyebrow {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.6;
		margin: 0;
	}

	.museum__brand-title {
		font-family: var(--font-museum);
		font-size: 1.5rem;
		font-weight: 400;
		font-style: italic;
		margin: 0.15rem 0 0;
	}

	.museum__nav {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.museum__nav a {
		color: var(--color-ink-soft);
		text-decoration: none;
	}

	.museum__main {
		padding-bottom: 8rem;
	}
</style>

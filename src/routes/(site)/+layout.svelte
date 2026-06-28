<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { artist, drawings } from '$lib/content';
	import { cacheAsset } from '$lib/drawing/asset-cache';

	let { children } = $props();

	onMount(() => {
		for (const d of drawings) void cacheAsset(d.thumb);
	});

	onNavigate((navigation) => {
		if (typeof document === 'undefined' || !document.startViewTransition) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	const isAtelier = $derived(page.route.id === '/(site)/atelier');
	const isHall = $derived(page.route.id === '/(site)');
</script>

<div
	class="site"
	class:site--immersive={isAtelier}
	class:site--hall={isHall}
>
	{#if !isAtelier}
		<header class="site__header">
			<div class="site__brand">
				<h1 class="site__brand-title">
					<a href="{base}/credits/">{artist.name}</a>
				</h1>
			</div>
		</header>
	{/if}

	<main class="site__main" class:site__main--immersive={isAtelier}>
		{@render children()}
	</main>
</div>

<style>
	.site {
		background: #fbfaf6;
		color: #1d1a16;
		min-height: 100vh;
		font-family: var(--font-museum);
	}

	.site--hall {
		background: #fff;
		color: #0a0a0a;
		display: flex;
		flex-direction: column;
		min-height: 0;
		height: 100vh;
		height: 100svh;
		overflow: hidden;
	}

	.site--hall .site__header {
		flex: 0 0 auto;
		min-height: auto;
		padding-block: max(0.65rem, env(safe-area-inset-top, 0px)) 0.65rem;
		border-bottom-color: rgba(0, 0, 0, 0.1);
	}

	.site--hall .site__brand-title {
		font-style: normal;
		letter-spacing: 0.02em;
	}

	.site--hall .site__main {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.site--immersive {
		min-height: 0;
		height: 100vh;
		height: 100lvh;
		overflow: hidden;
		background: none;
	}

	.site__header {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 3.25rem;
		box-sizing: border-box;
		padding: 1rem clamp(1rem, 3vw, 3.5rem);
		padding-inline: max(1rem, env(safe-area-inset-left, 0px))
			max(1rem, env(safe-area-inset-right, 0px));
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	.site__brand {
		text-align: center;
		min-width: 0;
		max-width: 100%;
	}

	.site__brand-title {
		font-family: var(--font-museum);
		font-size: clamp(1.2rem, 3.5vw, 1.5rem);
		font-weight: 400;
		font-style: italic;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.site__brand-title a {
		color: inherit;
		text-decoration: none;
	}

	.site__main {
		padding-bottom: clamp(2.5rem, 6vw, 4rem);
	}

	.site__main--immersive {
		padding-bottom: 0;
		height: 100%;
	}
</style>

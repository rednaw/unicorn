<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';

	let { children } = $props();

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
		background: #fbfaf6;
		color: #1d1a16;
		display: flex;
		flex-direction: column;
		min-height: 0;
		height: 100vh;
		height: 100svh;
		overflow: hidden;
	}

	.site--hall .site__main {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
		padding-top: env(safe-area-inset-top, 0px);
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.site--immersive {
		min-height: 0;
		height: 100vh;
		height: 100lvh;
		overflow: hidden;
		background: none;
	}

	.site__main {
		padding-bottom: clamp(2.5rem, 6vw, 4rem);
	}

	.site__main--immersive {
		padding-bottom: 0;
		height: 100%;
	}
</style>

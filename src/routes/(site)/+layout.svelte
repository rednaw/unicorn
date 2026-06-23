<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { artist, tracks } from '$lib/content';
	import { engine, initAudio } from '$lib/audio-engine.svelte';

	let { children } = $props();

	onMount(() => {
		if (!page.url.pathname.startsWith(`${base}/atelier`)) initAudio();
	});

	// Animate navigations between views with the View Transitions API.
	// Progressive enhancement: unsupported browsers / reduced-motion just swap.
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

	// Shell mode is derived state (not a hard route split) so a future
	// single-canvas view can reuse the same shell. The atelier renders immersive
	// (no header/padding, full-bleed); everything else renders paged.
	const isAtelier = $derived(page.url.pathname.startsWith(`${base}/atelier`));

	// Immersive "now near" cue: name the most-audible track, fading with its level.
	const nearTrack = $derived(engine.near.index >= 0 ? tracks[engine.near.index] : undefined);
</script>

<div class="site" class:site--immersive={isAtelier}>
	{#if !isAtelier}
		<header class="site__header">
			<div class="site__brand">
				<h1 class="site__brand-title">
					<a href="{base}/">{artist.name}</a>
				</h1>
			</div>
		</header>
	{/if}

	<main
		class="site__main"
		class:site__main--player={!isAtelier}
		class:site__main--immersive={isAtelier}
	>
		{@render children()}
	</main>

	{#if !isAtelier}
		<AudioPlayer variant="docked" />
	{/if}

	{#if isAtelier && nearTrack}
		<div
			class="site__nearcue"
			style:opacity={Math.min(1, engine.near.level * 1.4)}
			aria-hidden="true"
		>
			<span class="site__nearcue-label">nu dichtbij</span>
			<span class="site__nearcue-title">{nearTrack.title}</span>
		</div>
	{/if}
</div>

<style>
	.site {
		background: #fbfaf6;
		color: #1d1a16;
		min-height: 100vh;
		font-family: var(--font-museum);
	}

	/* Immersive (atelier): the page owns the full viewport; no paged chrome. */
	.site--immersive {
		min-height: 0;
		height: 100svh;
		overflow: hidden;
		background: none;
	}

	.site__header {
		display: flex;
		justify-content: center;
		align-items: center;
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

	.site__main--player {
		padding-bottom: clamp(4.5rem, 10vw, 6rem);
	}

	.site__main--immersive {
		padding-bottom: 0;
		height: 100%;
	}

	/* Immersive "now near" cue — minimal, auto-fades with proximity (opacity is
	   bound to the audible level, so it disappears when you move away). */
	.site__nearcue {
		position: fixed;
		left: 50%;
		bottom: 1.25rem;
		transform: translateX(-50%);
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.35rem 0.85rem;
		border-radius: 9999px;
		background: rgba(20, 18, 14, 0.5);
		color: #efe9da;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		pointer-events: none;
		z-index: 40;
		transition: opacity 200ms linear;
		max-width: calc(100vw - 1.5rem);
	}

	.site__nearcue-label {
		font-family: var(--font-sans);
		font-size: 0.6rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.7;
		flex: none;
	}

	.site__nearcue-title {
		font-family: var(--font-museum);
		font-style: italic;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (prefers-reduced-motion: reduce) {
		.site__nearcue {
			transition: none;
		}
	}
</style>

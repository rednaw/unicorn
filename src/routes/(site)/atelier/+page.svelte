<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { drawings, artist } from '$lib/content';
	import '$lib/atelier/backgrounds.css';
	import BackLink from '$lib/atelier/BackLink.svelte';
	import NearCue from '$lib/atelier/NearCue.svelte';
	import Canvas from '$lib/atelier/Canvas.svelte';
	import { createAtelierSession } from '$lib/atelier/atelier-session.svelte';

	const session = createAtelierSession({
		drawings,
		onNavigateHome: () => void goto(resolve('/'))
	});

	let atelierEl = $state<HTMLDivElement>();
	let viewport = $state<HTMLDivElement>();

	onMount(() => {
		let stop: (() => void) | undefined;
		void tick().then(() => {
			stop = session.start({
				getViewport: () => viewport,
				getRoot: () => atelierEl
			});
		});
		return () => stop?.();
	});
</script>

<svelte:head>
	<title>{artist.name}</title>
	<meta
		name="description"
		content="Tekeningen op tafel — zoom, pan en ontdek de bijbehorende muziek."
	/>
</svelte:head>

<div class="atelier" bind:this={atelierEl}>
	<div class="atelier__chrome">
		<BackLink onBack={session.goBack} />
		<NearCue nearDrawingId={session.nearCueDrawingId} />
	</div>

	<Canvas
		view={session.view}
		gestures={session.gestures}
		bind:viewport
		focusedId={session.focusedId}
		nearDrawingId={session.displayNearDrawingId}
		onFocusDrawing={session.focusDrawing}
	/>
</div>

<style>
	.atelier {
		height: 100vh;
		height: 100lvh;
		overflow: hidden;
		position: relative;
		font-family: var(--font-serif);
		touch-action: none;
		overscroll-behavior: none;
	}

	/* Fixed HUD above the pannable canvas (back, near cue). */
	.atelier__chrome {
		position: relative;
		z-index: 20;
		pointer-events: none;
	}

	.atelier__chrome :global(.back) {
		pointer-events: auto;
	}
</style>

<script lang="ts">
	import { drawings } from '$lib/content';
	import type { AtelierGestures } from './gestures.svelte';
	import type { AtelierView } from './view.svelte';
	import DrawingPiece from './DrawingPiece.svelte';

	let {
		view,
		gestures,
		viewport = $bindable(),
		focusedId,
		isPiecePlaying,
		onFocusDrawing
	}: {
		view: AtelierView;
		gestures: AtelierGestures;
		viewport?: HTMLDivElement;
		focusedId: string | null;
		isPiecePlaying: (id: string) => boolean;
		onFocusDrawing: (id: string) => void;
	} = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="atelier__viewport"
	bind:this={viewport}
	tabindex="0"
	aria-label="Atelier — pijltjestoetsen of WASD verschuiven, + en − zoomen, Escape terug"
	onpointerdown={gestures.onPointerDown}
	onpointermove={gestures.onPointerMove}
	onpointerup={gestures.onPointerUp}
	onpointercancel={gestures.onPointerUp}
	class:atelier__viewport--dragging={view.dragging}
>
	<div
		class="atelier__inner"
		style:transform="translate({view.tx}px, {view.ty}px) scale({view.zoom})"
		style:width="{view.canvas.width}px"
		style:height="{view.canvas.height}px"
	>
		{#each drawings as drawing (drawing.id)}
			<DrawingPiece
				{drawing}
				pos={view.drawingPos(drawing)}
				focused={drawing.id === focusedId}
				isNear={isPiecePlaying(drawing.id)}
				onfocus={() => onFocusDrawing(drawing.id)}
			/>
		{/each}
	</div>
</div>

<style>
	.atelier__viewport {
		position: absolute;
		inset: 0;
		z-index: 0;
		touch-action: none;
		cursor: grab;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}

	.atelier__viewport:focus {
		outline: none;
	}

	.atelier__viewport:focus-visible {
		outline: 2px solid rgba(212, 175, 95, 0.75);
		outline-offset: -4px;
	}

	.atelier__viewport--dragging {
		cursor: grabbing;
	}

	.atelier__inner {
		position: relative;
		transform-origin: 0 0;
	}
</style>

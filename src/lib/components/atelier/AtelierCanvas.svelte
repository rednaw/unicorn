<script lang="ts">
	import { drawings, tracks } from '$lib/content';
	import { ATELIER_CANVAS } from '$lib/atelier/constants';
	import type { AtelierGestures } from '$lib/atelier/atelier-gestures.svelte';
	import type { AtelierView } from '$lib/atelier/atelier-view.svelte';
	import AtelierDrawingPiece from './AtelierDrawingPiece.svelte';
	import AtelierSpeakerPiece from './AtelierSpeakerPiece.svelte';

	let {
		view,
		gestures,
		viewport = $bindable(),
		focusedId,
		prefetchIds,
		speakerLevels,
		onFocusDrawing,
		onFocusSpeaker
	}: {
		view: AtelierView;
		gestures: AtelierGestures;
		viewport?: HTMLDivElement;
		focusedId: string | null;
		prefetchIds: Set<string>;
		speakerLevels: number[];
		onFocusDrawing: (id: string) => void;
		onFocusSpeaker: (track: (typeof tracks)[number]) => void;
	} = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="atelier__viewport"
	bind:this={viewport}
	onpointerdown={gestures.onPointerDown}
	onpointermove={gestures.onPointerMove}
	onpointerup={gestures.onPointerUp}
	onpointercancel={gestures.onPointerUp}
	ondblclick={gestures.onDblClick}
	class:atelier__viewport--dragging={view.dragging}
>
	<div
		class="atelier__inner"
		style:transform="translate({view.tx}px, {view.ty}px) scale({view.zoom})"
		style:width="{ATELIER_CANVAS.width}px"
		style:height="{ATELIER_CANVAS.height}px"
	>
		{#each drawings as drawing (drawing.id)}
			<AtelierDrawingPiece
				{drawing}
				prefetch={prefetchIds.has(drawing.id)}
				focused={drawing.id === focusedId}
				onfocus={() => onFocusDrawing(drawing.id)}
			/>
		{/each}

		{#each tracks as track, i (track.id)}
			<AtelierSpeakerPiece
				{track}
				level={speakerLevels[i] ?? 0}
				onfocus={() => onFocusSpeaker(track)}
			/>
		{/each}
	</div>
</div>

<style>
	.atelier__viewport {
		position: absolute;
		inset: 0;
		touch-action: none;
		cursor: grab;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}

	.atelier__viewport--dragging {
		cursor: grabbing;
	}

	.atelier__inner {
		position: relative;
		transform-origin: 0 0;
		will-change: transform;
	}
</style>

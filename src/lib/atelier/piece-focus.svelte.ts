/**
 * Tap-focus on a drawing: visual highlight (`focusedId`) and a temporary pin that
 * overrides NearCue + spatial audio until the visitor pans or zooms (`releasePin`).
 */
export function createPieceFocus() {
	let focusedId = $state<string | null>(null);
	let pinned = $state(false);

	const pinnedDrawingId = $derived(pinned && focusedId ? focusedId : null);

	function focus(drawingId: string) {
		focusedId = drawingId;
		pinned = true;
	}

	function releasePin() {
		pinned = false;
	}

	function clear() {
		focusedId = null;
		pinned = false;
	}

	return {
		get focusedId() {
			return focusedId;
		},
		get pinnedDrawingId() {
			return pinnedDrawingId;
		},
		get isPinned() {
			return pinned;
		},
		focus,
		releasePin,
		clear
	};
}

export type PieceFocus = ReturnType<typeof createPieceFocus>;

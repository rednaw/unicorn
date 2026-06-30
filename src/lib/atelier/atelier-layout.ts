import { drawings, type Drawing } from '$lib/content';
import { LEATHER_PAD_INSET, rotatedPieceBounds } from './drawing-geometry';
import type { ViewportRect } from './view-math';

export type AtelierLayoutMode = 'landscape' | 'portrait';

/** Max viewport width for portrait layout (see resolveLayoutMode). */
export const ATELIER_PORTRAIT_MAX_WIDTH = 767;

const CONTENT_MARGIN = 36;
const DESK_MARGIN = LEATHER_PAD_INSET + CONTENT_MARGIN;

export function resolveLayoutMode(viewport: ViewportRect): AtelierLayoutMode {
	const { width, height } = viewport;
	if (width <= ATELIER_PORTRAIT_MAX_WIDTH && height > width) return 'portrait';
	return 'landscape';
}

/** Floor position for the active layout mode. */
export function layoutPos(drawing: Drawing, mode: AtelierLayoutMode): { x: number; y: number } {
	return mode === 'portrait' ? drawing.portrait : drawing.landscape;
}

export function computeAtelierCanvas(mode: AtelierLayoutMode) {
	let maxRight = 0;
	let maxBottom = 0;
	for (const d of drawings) {
		const pos = layoutPos(d, mode);
		const box = rotatedPieceBounds(d, pos);
		maxRight = Math.max(maxRight, box.right);
		maxBottom = Math.max(maxBottom, box.bottom);
	}
	return {
		width: Math.ceil(maxRight + DESK_MARGIN),
		height: Math.ceil(maxBottom + DESK_MARGIN)
	};
}

import { drawings, getStackedDrawingOrder } from '$lib/content';
import { LEATHER_PAD_INSET, pieceBounds, rotatedPieceBounds } from './drawing-geometry';
import type { ViewportRect } from './view-math';

export type AtelierLayoutMode = 'scattered' | 'stacked';

/** Max viewport width for the stacked phone layout (portrait only — see resolveLayoutMode). */
export const ATELIER_PHONE_MAX_WIDTH = 767;

const CONTENT_MARGIN = 36;
const DESK_MARGIN = LEATHER_PAD_INSET + CONTENT_MARGIN;

/** Phone column — tuned to match the previous hand-keyed layout for six drawings. */
const STACKED_START_Y = 52;
const STACKED_GAP = 32;
const STACKED_X_BASE = 108;
const STACKED_X_STAGGER = [0, 72, -36, -64, 48, -60];

function computeStackedPositions(): Record<string, { x: number; y: number }> {
	const order = getStackedDrawingOrder();
	const byId = new Map(drawings.map((d) => [d.id, d]));
	let y = STACKED_START_Y;
	const result: Record<string, { x: number; y: number }> = {};

	for (let i = 0; i < order.length; i++) {
		const id = order[i];
		const drawing = byId.get(id);
		if (!drawing) continue;
		const stagger = STACKED_X_STAGGER[i % STACKED_X_STAGGER.length] ?? 0;
		result[id] = { x: STACKED_X_BASE + stagger, y };
		y += pieceBounds(drawing).height + STACKED_GAP;
	}

	return result;
}

const STACKED_POSITIONS = computeStackedPositions();

export function resolveLayoutMode(viewport: ViewportRect): AtelierLayoutMode {
	const { width, height } = viewport;
	// Stacked only on portrait phones. Landscape (e.g. iPhone SE 667×375) uses scattered.
	if (width <= ATELIER_PHONE_MAX_WIDTH && height > width) {
		return 'stacked';
	}
	return 'scattered';
}

export function layoutPos(
	drawingId: string,
	mode: AtelierLayoutMode,
	scatteredPos?: { x: number; y: number }
): { x: number; y: number } {
	if (mode === 'stacked') {
		return STACKED_POSITIONS[drawingId] ?? scatteredPos ?? { x: 0, y: 0 };
	}
	return scatteredPos ?? { x: 0, y: 0 };
}

export function computeAtelierCanvas(mode: AtelierLayoutMode) {
	let maxRight = 0;
	let maxBottom = 0;
	for (const d of drawings) {
		const pos = layoutPos(d.id, mode, d.pos);
		const box = rotatedPieceBounds(d, pos);
		maxRight = Math.max(maxRight, box.right);
		maxBottom = Math.max(maxBottom, box.bottom);
	}
	return {
		width: Math.ceil(maxRight + DESK_MARGIN),
		height: Math.ceil(maxBottom + DESK_MARGIN)
	};
}

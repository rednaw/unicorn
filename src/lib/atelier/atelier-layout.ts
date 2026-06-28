import { drawings } from '$lib/content';
import { LEATHER_PAD_INSET, rotatedPieceBounds } from './drawing-geometry';
import type { ViewportRect } from './view-math';

export type AtelierLayoutMode = 'scattered' | 'stacked';

/** Max viewport width for the stacked phone layout (portrait only — see resolveLayoutMode). */
export const ATELIER_PHONE_MAX_WIDTH = 767;

const CONTENT_MARGIN = 36;
const DESK_MARGIN = LEATHER_PAD_INSET + CONTENT_MARGIN;

/** Phone: vertical column with slight horizontal stagger — generous gaps between mats. */
const STACKED_POSITIONS: Record<string, { x: number; y: number }> = {
	maskers: { x: 108, y: 52 },
	'buste-profiel': { x: 180, y: 540 },
	'lachend-portret': { x: 72, y: 1080 },
	'studie-i': { x: 44, y: 1620 },
	profielstudie: { x: 156, y: 2160 },
	'portret-strik': { x: 48, y: 2700 }
};

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

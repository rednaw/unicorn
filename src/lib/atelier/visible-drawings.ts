import { drawings, type Drawing } from '$lib/content';
import { layoutPos, type AtelierLayoutMode } from '$lib/atelier/atelier-layout';
import { ATELIER_PREFETCH } from '$lib/atelier/constants';
import { rotatedPieceBounds } from '$lib/atelier/drawing-geometry';
import type { ViewTransform, ViewportRect } from '$lib/atelier/view-math';

export type VisibleDrawing = {
	drawing: Drawing;
	distance: number;
	/** Share of the visible region this drawing's bounds cover (0–1). */
	coverage: number;
};

function visibleCanvasRect(view: ViewTransform, viewport: ViewportRect) {
	return {
		left: -view.tx / view.zoom,
		top: -view.ty / view.zoom,
		right: (viewport.width - view.tx) / view.zoom,
		bottom: (viewport.height - view.ty) / view.zoom
	};
}

function rectsIntersect(
	a: { left: number; top: number; right: number; bottom: number },
	b: { left: number; top: number; right: number; bottom: number }
) {
	return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/** Drawings intersecting the viewport, nearest-first (canvas centre distance). */
export function visibleDrawings(
	view: ViewTransform,
	viewport: ViewportRect,
	layoutMode: AtelierLayoutMode,
	posFor: (d: Drawing) => { x: number; y: number } = (d) => layoutPos(d, layoutMode)
): VisibleDrawing[] {
	if (viewport.width === 0) return [];

	const region = visibleCanvasRect(view, viewport);
	const regionArea = Math.max(
		1,
		(region.right - region.left) * (region.bottom - region.top)
	);
	const centre = {
		x: (region.left + region.right) / 2,
		y: (region.top + region.bottom) / 2
	};
	const hits: VisibleDrawing[] = [];

	for (const drawing of drawings) {
		const pos = posFor(drawing);
		const box = rotatedPieceBounds(drawing, pos);
		if (!rectsIntersect(region, box)) continue;
		const overlapW = Math.min(region.right, box.right) - Math.max(region.left, box.left);
		const overlapH = Math.min(region.bottom, box.bottom) - Math.max(region.top, box.top);
		const coverage = Math.max(0, overlapW) * Math.max(0, overlapH) / regionArea;
		hits.push({
			drawing,
			distance: Math.hypot(
				(box.left + box.right) / 2 - centre.x,
				(box.top + box.bottom) / 2 - centre.y
			),
			coverage
		});
	}

	hits.sort((a, b) => a.distance - b.distance);
	return hits;
}

/** Queue full-res for drawings the visitor is inspecting (cover enough of the view), nearest-first. */
export function prefetchIntentsForView(
	view: ViewTransform,
	viewport: ViewportRect,
	layoutMode: AtelierLayoutMode,
	posFor: (d: Drawing) => { x: number; y: number }
): { id: string; intent: 'sharp' }[] {
	return visibleDrawings(view, viewport, layoutMode, posFor)
		.filter(({ coverage }) => coverage >= ATELIER_PREFETCH.fullResCoverage)
		.map(({ drawing }) => ({ id: drawing.id, intent: 'sharp' as const }));
}

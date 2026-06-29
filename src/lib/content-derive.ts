import {
	DEFAULT_DRAWING_WIDTH,
	DRAWING_SLOT_PADDING_X,
	SHARP_DPR,
	type Atelier,
	type Drawing,
	type DrawingWithTrack,
	type TableDrawing
} from './content-types';

/** Compose table-relative positions into absolute floor coordinates. */
export function flattenAtelier(atelier: Atelier): Drawing[] {
	const out: Drawing[] = [];
	for (const table of atelier.tables) {
		for (const drawing of table.drawings) {
			out.push({
				...drawing,
				pos: {
					x: table.center.x + drawing.pos.x,
					y: table.center.y + drawing.pos.y
				}
			});
		}
	}
	return out;
}

/** Entry drawing first, then remaining drawings in flatten order. */
export function stackedDrawingOrder(atelier: Atelier, flat: Drawing[]): string[] {
	const { entryDrawingId } = atelier;
	const ids = flat.map((d) => d.id);
	return [entryDrawingId, ...ids.filter((id) => id !== entryDrawingId)];
}

export function audioDrawingsFrom(flat: Drawing[]): DrawingWithTrack[] {
	return flat.filter((d): d is DrawingWithTrack => !!d.track);
}

export function audioIndexForDrawing(flat: Drawing[], drawingId: string): number {
	return audioDrawingsFrom(flat).findIndex((d) => d.id === drawingId);
}

/**
 * Max zoom before the browser upscales past 1:1 device pixels on `src`.
 * `width` is the piece slot; the image spans `width - DRAWING_SLOT_PADDING_X`.
 */
export function maxSharpZoomForDrawing(d: Drawing): number {
	const inner = (d.width ?? DEFAULT_DRAWING_WIDTH) - DRAWING_SLOT_PADDING_X;
	return d.srcWidth / (inner * SHARP_DPR);
}

export function atelierMaxZoom(flat: Drawing[]): number {
	return Math.min(...flat.map(maxSharpZoomForDrawing));
}

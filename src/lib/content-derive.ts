import {
	DEFAULT_DRAWING_WIDTH,
	DRAWING_SLOT_PADDING_X,
	SHARP_DPR,
	type Drawing,
	type DrawingWithTrack
} from './content-types';

export function audioDrawingsFrom(flat: Drawing[]): DrawingWithTrack[] {
	return flat.filter((d): d is DrawingWithTrack => !!d.track);
}

/** Precomputed `drawingId` → index in `audioDrawingsFrom(flat)`. */
export function audioIndexMapFrom(flat: Drawing[]): ReadonlyMap<string, number> {
	const map = new Map<string, number>();
	for (const [index, d] of audioDrawingsFrom(flat).entries()) {
		map.set(d.id, index);
	}
	return map;
}

/**
 * Max zoom before the browser upscales past 1:1 device pixels on `src`.
 * `width` is the piece slot; the image spans `width - DRAWING_SLOT_PADDING_X`.
 */
export function maxSharpZoomForDrawing(d: Drawing): number {
	const inner = (d.width ?? DEFAULT_DRAWING_WIDTH) - DRAWING_SLOT_PADDING_X;
	return d.srcWidth / (inner * SHARP_DPR);
}

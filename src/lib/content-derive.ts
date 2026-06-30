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

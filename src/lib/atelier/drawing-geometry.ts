import { DRAWING_SLOT_PADDING_X, trackForDrawing, type Drawing } from '$lib/content';
import { DEFAULT_DRAWING_WIDTH } from './constants';

/** Mat chrome — keep in sync with `DrawingPiece.svelte`. */
export const PIECE_MAT = { top: 14, bottom: 36, track: 72 } as const;

/** Full piece slot including image, mat padding, and optional track caption. */
export function pieceBounds(drawing: Drawing) {
	const width = drawing.width ?? DEFAULT_DRAWING_WIDTH;
	const innerW = width - DRAWING_SLOT_PADDING_X;
	const imageH = innerW * (drawing.srcHeight / drawing.srcWidth);
	const trackH = trackForDrawing(drawing.id) ? PIECE_MAT.track : 0;
	const height = PIECE_MAT.top + imageH + trackH + PIECE_MAT.bottom;
	return { width, height, imageH };
}

export function drawingSize(drawing: Drawing) {
	return pieceBounds(drawing);
}

export function drawingAtCanvasPoint(
	drawings: Drawing[],
	canvasX: number,
	canvasY: number
): string | null {
	for (const d of drawings) {
		const { width, height } = pieceBounds(d);
		const x = d.pos?.x ?? 0;
		const y = d.pos?.y ?? 0;
		if (canvasX >= x && canvasX <= x + width && canvasY >= y && canvasY <= y + height) {
			return d.id;
		}
	}
	return null;
}

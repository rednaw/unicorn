import { DEFAULT_DRAWING_WIDTH, DRAWING_SLOT_PADDING_X, type Drawing } from '$lib/content';

/** Mat chrome — keep in sync with `DrawingPiece.svelte`. */
export const PIECE_MAT = { top: 14, side: 14, bottom: 14, plaque: 54 } as const;

/** Must stay in sync with `.atelier__inner::after { inset }` in `backgrounds/shared.css`. */
export const LEATHER_PAD_INSET = 44;

/** Full piece slot including image, mat padding, and optional audio plaque. */
export function pieceBounds(drawing: Drawing) {
	const width = drawing.width ?? DEFAULT_DRAWING_WIDTH;
	const innerW = width - DRAWING_SLOT_PADDING_X;
	const imageH = innerW * (drawing.srcHeight / drawing.srcWidth);
	const plaqueH = drawing.track ? PIECE_MAT.plaque : 0;
	const height = PIECE_MAT.top + imageH + plaqueH + PIECE_MAT.bottom;
	return { width, height };
}

/** Centre of the mat — spatial audio origin and zoom focus. */
export function drawingListenPoint(drawing: Drawing, pos = drawing.landscape) {
	const { width, height } = pieceBounds(drawing);
	const x = pos?.x ?? 0;
	const y = pos?.y ?? 0;
	return { x: x + width / 2, y: y + height / 2 };
}

/** Axis-aligned bounds after mat rotation (transform-origin: centre). */
export function rotatedPieceBounds(drawing: Drawing, pos = drawing.landscape) {
	const { width, height } = pieceBounds(drawing);
	const x = pos?.x ?? 0;
	const y = pos?.y ?? 0;
	const rot = ((drawing.rotation ?? 0) * Math.PI) / 180;
	const sin = Math.abs(Math.sin(rot));
	const cos = Math.abs(Math.cos(rot));
	const aabbW = width * cos + height * sin;
	const aabbH = width * sin + height * cos;
	const cx = x + width / 2;
	const cy = y + height / 2;
	return {
		left: cx - aabbW / 2,
		top: cy - aabbH / 2,
		right: cx + aabbW / 2,
		bottom: cy + aabbH / 2,
		width: aabbW,
		height: aabbH
	};
}

export function drawingAtCanvasPoint(
	drawings: Drawing[],
	canvasX: number,
	canvasY: number,
	posFor: (d: Drawing) => { x: number; y: number } = (d) => d.landscape ?? { x: 0, y: 0 }
): string | null {
	for (const d of drawings) {
		const { width, height } = pieceBounds(d);
		const { x, y } = posFor(d);
		const rot = ((d.rotation ?? 0) * Math.PI) / 180;
		const cx = x + width / 2;
		const cy = y + height / 2;
		const dx = canvasX - cx;
		const dy = canvasY - cy;
		const cos = Math.cos(-rot);
		const sin = Math.sin(-rot);
		const localX = dx * cos - dy * sin + width / 2;
		const localY = dx * sin + dy * cos + height / 2;
		if (localX >= 0 && localX <= width && localY >= 0 && localY <= height) {
			return d.id;
		}
	}
	return null;
}

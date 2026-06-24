import { drawings } from '$lib/content';
import { pieceBounds } from './drawing-geometry';

/** Leather pad margin beyond outermost piece. */
const DESK_MARGIN = 56;

export function computeAtelierCanvas() {
	let width = 0;
	let height = 0;
	for (const d of drawings) {
		const { width: pw, height: ph } = pieceBounds(d);
		width = Math.max(width, (d.pos?.x ?? 0) + pw);
		height = Math.max(height, (d.pos?.y ?? 0) + ph);
	}
	return {
		width: Math.ceil(width + DESK_MARGIN),
		height: Math.ceil(height + DESK_MARGIN)
	};
}

import type { Drawing } from '$lib/content';
import { DEFAULT_DRAWING_WIDTH, DRAWING_ASPECT } from './constants';

export function drawingSize(drawing: Drawing) {
	const width = drawing.width ?? DEFAULT_DRAWING_WIDTH;
	return { width, height: width * DRAWING_ASPECT };
}

export function drawingAtCanvasPoint(
	drawings: Drawing[],
	canvasX: number,
	canvasY: number
): string | null {
	for (const d of drawings) {
		const { width, height } = drawingSize(d);
		const x = d.pos?.x ?? 0;
		const y = d.pos?.y ?? 0;
		if (canvasX >= x && canvasX <= x + width && canvasY >= y && canvasY <= y + height) {
			return d.id;
		}
	}
	return null;
}

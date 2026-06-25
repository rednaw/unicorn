import { audioDrawings } from '$lib/content';
import { layoutPos, type AtelierLayoutMode } from './atelier-layout';
import { ATELIER_AUDIO } from './constants';
import { drawingListenPoint } from './drawing-geometry';
import { smoothstep } from './math';
import { canvasCentre, type ViewTransform, type ViewportRect } from './view-math';

export type SpatialDrawingMix = {
	drawingId: string;
	audioIndex: number;
	volume: number;
	pan: number;
};

export type SpatialMixResult = {
	drawings: SpatialDrawingMix[];
	nearDrawingId: string | null;
	nearLevel: number;
};

/** Mat centres for the active desk layout. */
function listenPoints(mode: AtelierLayoutMode) {
	return audioDrawings.map((d) => ({
		id: d.id,
		...drawingListenPoint(d, layoutPos(d.id, mode, d.pos))
	}));
}

function clamp01(value: number): number {
	return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function computeSpatialMix(
	view: ViewTransform,
	viewport: ViewportRect,
	layoutMode: AtelierLayoutMode
): SpatialMixResult {
	const centre = canvasCentre(view, viewport);
	const { zoomGateLow, zoomGateHigh, proxRadius, panCap, nearThreshold } = ATELIER_AUDIO;
	const zoomGate = smoothstep(
		clamp01((view.zoom - zoomGateLow) / (zoomGateHigh - zoomGateLow))
	);
	const halfWidth = viewport.width / 2;

	let nearDrawingId: string | null = null;
	let nearLevel = 0;

	const drawings = listenPoints(layoutMode).map((point, audioIndex) => {
		const dist = Math.hypot(point.x - centre.x, point.y - centre.y);
		const volume = smoothstep(clamp01(1 - dist / proxRadius)) * zoomGate;
		const screenX = view.tx + point.x * view.zoom;
		const pan = Math.max(-1, Math.min(1, (screenX - halfWidth) / halfWidth)) * panCap;

		if (volume > nearLevel) {
			nearLevel = volume;
			nearDrawingId = point.id;
		}
		return { drawingId: point.id, audioIndex, volume, pan };
	});

	const near = zoomGate > 0 && nearLevel > nearThreshold;
	return {
		drawings,
		nearDrawingId: near ? nearDrawingId : null,
		nearLevel: zoomGate > 0 ? nearLevel : 0
	};
}

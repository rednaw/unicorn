import { audioDrawings, drawings, type Drawing } from '$lib/content';
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
	/** Loudest audible track — use for HMV / HUD when it disagrees with geometric near. */
	dominantAudioDrawingId: string | null;
};

/** Mat centres for the active desk layout. */
function listenPoints(list: Drawing[], mode: AtelierLayoutMode) {
	return list.map((d) => ({
		id: d.id,
		...drawingListenPoint(d, layoutPos(d, mode))
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

	const mixes: SpatialDrawingMix[] = listenPoints(audioDrawings, layoutMode).map(
		(point, audioIndex) => {
			const dist = Math.hypot(point.x - centre.x, point.y - centre.y);
			const volume = smoothstep(clamp01(1 - dist / proxRadius)) * zoomGate;
			const screenX = view.tx + point.x * view.zoom;
			const pan = Math.max(-1, Math.min(1, (screenX - halfWidth) / halfWidth)) * panCap;
			return { drawingId: point.id, audioIndex, volume, pan };
		}
	);

	for (const point of listenPoints(drawings, layoutMode)) {
		const dist = Math.hypot(point.x - centre.x, point.y - centre.y);
		const level = smoothstep(clamp01(1 - dist / proxRadius)) * zoomGate;
		if (level > nearLevel) {
			nearLevel = level;
			nearDrawingId = point.id;
		}
	}

	const near = zoomGate > 0 && nearLevel > nearThreshold;

	let dominantAudioDrawingId: string | null = null;
	let maxVolume = 0;
	for (const { drawingId, volume } of mixes) {
		if (volume > maxVolume) {
			maxVolume = volume;
			dominantAudioDrawingId = drawingId;
		}
	}
	if (maxVolume <= nearThreshold) dominantAudioDrawingId = null;

	return {
		drawings: mixes,
		nearDrawingId: near ? nearDrawingId : null,
		nearLevel: zoomGate > 0 ? nearLevel : 0,
		dominantAudioDrawingId
	};
}

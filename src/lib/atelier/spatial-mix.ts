import { tracks } from '$lib/content';
import { ATELIER_AUDIO } from './constants';
import { smoothstep } from './math';
import { spatialListenPoint } from './spatial-positions';
import { canvasCentre, type ViewTransform, type ViewportRect } from './view-math';

export type SpatialTrackMix = { index: number; volume: number; pan: number };

export type SpatialMixResult = {
	tracks: SpatialTrackMix[];
	nearIndex: number;
	nearLevel: number;
};

export function computeSpatialMix(
	view: ViewTransform,
	viewport: ViewportRect
): SpatialMixResult {
	const centre = canvasCentre(view, viewport);
	const zg = Math.max(
		0,
		Math.min(
			1,
			(view.zoom - ATELIER_AUDIO.zoomGateLow) / (ATELIER_AUDIO.zoomGateHigh - ATELIER_AUDIO.zoomGateLow)
		)
	);
	const zoomGate = smoothstep(zg);

	let nearIndex = -1;
	let nearLevel = 0;
	const mixes: SpatialTrackMix[] = [];

	tracks.forEach((track, index) => {
		const point = spatialListenPoint(track);
		if (!point) return;
		const dx = point.x - centre.x;
		const dy = point.y - centre.y;
		const dist = Math.hypot(dx, dy);
		const t = Math.max(0, 1 - dist / ATELIER_AUDIO.proxRadius);
		// Squared falloff — only the nearest speaker is audible when close.
		const volume = smoothstep(t * t) * zoomGate;
		const screenX = view.tx + point.x * view.zoom;
		const pan =
			Math.max(-1, Math.min(1, (screenX - viewport.width / 2) / (viewport.width / 2))) *
			ATELIER_AUDIO.panCap;

		mixes.push({ index, volume, pan });
		if (volume > nearLevel) {
			nearLevel = volume;
			nearIndex = index;
		}
	});

	return {
		tracks: mixes,
		nearIndex: nearLevel > ATELIER_AUDIO.nearThreshold ? nearIndex : -1,
		nearLevel
	};
}

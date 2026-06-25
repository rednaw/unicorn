import { applySpatial, engine, setNear } from './audio-engine.svelte';
import { computeSpatialMix } from './spatial-mix';
import type { AtelierView } from './view.svelte';

export function createSpatialAudioLoop(view: AtelierView) {
	let nearDrawingId = $state<string | null>(null);
	let raf = 0;

	function tick() {
		raf = requestAnimationFrame(tick);

		if (document.hidden || view.metrics.width === 0) return;

		const mix = computeSpatialMix(view.getView(), view.metrics, view.layoutMode);
		for (const { audioIndex, volume, pan } of mix.drawings) {
			applySpatial(audioIndex, volume, pan);
		}
		if (engine.armed) {
			if (mix.nearDrawingId !== nearDrawingId) {
				nearDrawingId = mix.nearDrawingId;
			}
			setNear(mix.nearDrawingId, mix.nearLevel);
		} else if (nearDrawingId !== null) {
			nearDrawingId = null;
			setNear(null, 0);
		}
	}

	function start() {
		if (raf) return;
		raf = requestAnimationFrame(tick);
	}

	function stop() {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	}

	return {
		get nearDrawingId() {
			return nearDrawingId;
		},
		start,
		stop
	};
}

export type SpatialAudioLoop = ReturnType<typeof createSpatialAudioLoop>;

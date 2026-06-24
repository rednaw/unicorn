import { tracks } from '$lib/content';
import { applySpatial, setNear } from '$lib/audio-engine.svelte';
import { computeSpatialMix } from './spatial-mix';
import type { AtelierView } from './atelier-view.svelte';

export function createSpatialAudioLoop(view: AtelierView) {
	let speakerLevels = $state<number[]>(tracks.map(() => 0));
	let raf = 0;

	function tick() {
		const { width, height } = view.metrics;
		if (width === 0) {
			raf = requestAnimationFrame(tick);
			return;
		}

		const mix = computeSpatialMix(view.getView(), { width, height });
		const levels = tracks.map(() => 0);
		for (const { index, volume, pan } of mix.tracks) {
			applySpatial(index, volume, pan);
			levels[index] = volume;
		}
		speakerLevels = levels;
		setNear(mix.nearIndex, mix.nearLevel);
		raf = requestAnimationFrame(tick);
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
		get speakerLevels() {
			return speakerLevels;
		},
		start,
		stop
	};
}

export type SpatialAudioLoop = ReturnType<typeof createSpatialAudioLoop>;

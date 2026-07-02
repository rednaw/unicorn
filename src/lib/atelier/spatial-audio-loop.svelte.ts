import { applyMix, engine, setNear } from './audio-engine.svelte';
import type { PieceFocus } from './piece-focus.svelte';
import { applyPinnedAudioFocus, computeSpatialMix } from './spatial-mix';
import type { AtelierView } from './view.svelte';

export function createSpatialAudioLoop(view: AtelierView, pieceFocus: PieceFocus) {
	let nearDrawingId = $state<string | null>(null);
	let dominantAudioDrawingId = $state<string | null>(null);
	let raf = 0;

	const displayNearDrawingId = $derived(
		pieceFocus.pinnedDrawingId ?? dominantAudioDrawingId ?? nearDrawingId
	);

	const nearCueDrawingId = $derived(
		engine.armed || pieceFocus.isPinned ? displayNearDrawingId : null
	);

	function tick() {
		raf = requestAnimationFrame(tick);

		if (document.hidden || view.metrics.width === 0) return;

		let mix = computeSpatialMix(view.getView(), view.metrics, view.layoutMode);
		const pin = pieceFocus.pinnedDrawingId;
		if (pin) mix = applyPinnedAudioFocus(mix, pin);
		applyMix(mix);
		if (engine.armed) {
			if (mix.nearDrawingId !== nearDrawingId) {
				nearDrawingId = mix.nearDrawingId;
			}
			if (mix.dominantAudioDrawingId !== dominantAudioDrawingId) {
				dominantAudioDrawingId = mix.dominantAudioDrawingId;
			}
			setNear(mix.nearDrawingId, mix.nearLevel);
		} else {
			if (nearDrawingId !== null) nearDrawingId = null;
			if (dominantAudioDrawingId !== null) dominantAudioDrawingId = null;
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
		get dominantAudioDrawingId() {
			return dominantAudioDrawingId;
		},
		get displayNearDrawingId() {
			return displayNearDrawingId;
		},
		get nearCueDrawingId() {
			return nearCueDrawingId;
		},
		start,
		stop
	};
}

export type SpatialAudioLoop = ReturnType<typeof createSpatialAudioLoop>;

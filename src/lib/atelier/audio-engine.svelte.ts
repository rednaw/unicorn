import { audioDrawings } from '$lib/content';
import { ATELIER_AUDIO } from './constants';

type TrackNodes = {
	el: HTMLAudioElement;
	gain: GainNode;
	panner: StereoPannerNode | null;
};

export const engine = $state({
	ready: false,
	unlocked: false,
	near: { drawingId: null as string | null, level: 0 }
});

let ctx: AudioContext | undefined;
let nodes: TrackNodes[] = [];

export function initAudio(): void {
	if (engine.ready || typeof window === 'undefined') return;
	const Ctx: typeof AudioContext =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
	ctx = new Ctx();
	const canPan = typeof ctx.createStereoPanner === 'function';

	nodes = audioDrawings.map((d) => {
		const el = new Audio(d.track.src);
		el.preload = 'metadata';
		el.loop = false;
		const source = ctx!.createMediaElementSource(el);
		const gain = ctx!.createGain();
		gain.gain.value = 0;
		let panner: StereoPannerNode | null = null;
		if (canPan) {
			panner = ctx!.createStereoPanner();
			source.connect(gain).connect(panner).connect(ctx!.destination);
		} else {
			source.connect(gain).connect(ctx!.destination);
		}
		el.pause();
		return { el, gain, panner };
	});

	engine.ready = true;
}

/** Resume the audio graph on user gesture — do not start any recordings. */
export function unlock(): void {
	if (!ctx) return;
	if (ctx.state !== 'running') void ctx.resume().catch(() => {});
	if (engine.unlocked) return;
	engine.unlocked = true;
	// Inaudible blip to satisfy autoplay policy without advancing track positions.
	const buffer = ctx.createBuffer(1, 1, 22050);
	const src = ctx.createBufferSource();
	src.buffer = buffer;
	src.connect(ctx.destination);
	src.start();
}

export function enterSpatial(): void {
	initAudio();
	engine.near = { drawingId: null, level: 0 };
	pauseAllTracks();
}

export function applySpatial(i: number, gain: number, pan: number): void {
	const n = nodes[i];
	if (!n || !ctx) return;
	const now = ctx.currentTime;
	const audible = engine.unlocked && gain >= ATELIER_AUDIO.playThreshold;

	n.gain.gain.setTargetAtTime(gain, now, ATELIER_AUDIO.rampTimeSec);
	n.panner?.pan.setTargetAtTime(pan, now, ATELIER_AUDIO.rampTimeSec);

	if (audible) {
		if (n.el.paused) {
			if (n.el.ended) n.el.currentTime = 0;
			void n.el.play().catch(() => {});
		}
	} else if (!n.el.paused) {
		n.el.pause();
	}
}

export function pauseAllTracks(): void {
	for (const n of nodes) {
		if (!n.el.paused) n.el.pause();
	}
	if (ctx) {
		const now = ctx.currentTime;
		for (const n of nodes) {
			n.gain.gain.cancelScheduledValues(now);
			n.gain.gain.setValueAtTime(0, now);
		}
	}
}

export function setNear(drawingId: string | null, level: number): void {
	if (
		engine.near.drawingId === drawingId &&
		Math.abs(engine.near.level - level) < 0.02
	) {
		return;
	}
	engine.near = { drawingId, level };
}

export function leaveSpatial(): void {
	pauseAllTracks();
	engine.near = { drawingId: null, level: 0 };
}

import { tracks } from '$lib/content';

type TrackNodes = {
	el: HTMLAudioElement;
	gain: GainNode;
	panner: StereoPannerNode | null;
};

export const engine = $state({
	ready: false,
	unlocked: false,
	near: { index: -1, level: 0 }
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

	nodes = tracks.map((t) => {
		const el = new Audio(t.src);
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
		return { el, gain, panner };
	});

	engine.ready = true;
}

export function unlock(): void {
	if (!ctx || engine.unlocked) return;
	engine.unlocked = true;
	void ctx.resume().catch(() => {});
	for (const n of nodes) {
		if (n.el.paused) {
			n.el
				.play()
				.then(() => n.el.pause())
				.catch(() => {});
		}
	}
}

export function enterSpatial(): void {
	initAudio();
	engine.near = { index: -1, level: 0 };
}

export function applySpatial(i: number, gain: number, pan: number): void {
	const n = nodes[i];
	if (!n || !ctx) return;
	const now = ctx.currentTime;
	n.gain.gain.setTargetAtTime(gain, now, 0.08);
	n.panner?.pan.setTargetAtTime(pan, now, 0.08);
	if (gain > 0.05) {
		if (n.el.paused) {
			if (n.el.ended) n.el.currentTime = 0;
			void n.el.play().catch(() => {});
		}
	} else if (gain < 0.01 && !n.el.paused) {
		n.el.pause();
	}
}

export function setNear(index: number, level: number): void {
	engine.near = { index, level };
}

export function leaveSpatial(): void {
	if (!ctx) return;
	const now = ctx.currentTime;
	for (const n of nodes) {
		n.gain.gain.cancelScheduledValues(now);
		n.gain.gain.setValueAtTime(0, now);
		if (!n.el.paused) n.el.pause();
	}
	engine.near = { index: -1, level: 0 };
}

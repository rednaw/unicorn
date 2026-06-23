// Single shared audio engine for both views.
//
// One AudioContext owns one <audio> element per track, each routed through
// source -> gain -> stereo panner -> destination. Two "renderers" drive the
// same nodes:
//   - playlist (museum/gallery): one track audible at a time, transport + auto-advance
//   - spatial (atelier): per-frame gain/pan from proximity + zoom, multiple at once
//
// This keeps playback continuous across views and loads each file only once.
// It is strictly client-side: nothing here touches the DOM/Web Audio during SSR.

import { tracks } from '$lib/content';

type Mode = 'playlist' | 'spatial';

type TrackNodes = {
	el: HTMLAudioElement;
	source: MediaElementAudioSourceNode;
	gain: GainNode;
	panner: StereoPannerNode | null;
};

export const engine = $state({
	ready: false,
	unlocked: false,
	/** True once the listener has started any playback at least once. */
	started: false,
	mode: 'playlist' as Mode,
	index: 0,
	isPlaying: false,
	currentTime: 0,
	duration: 0,
	/** Spatial mode: the track currently most audible, for the "now near" cue. */
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

	nodes = tracks.map((t, i) => {
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

		el.addEventListener('ended', () => onEnded(i));
		el.addEventListener('timeupdate', () => {
			if (i === engine.index) engine.currentTime = el.currentTime;
		});
		el.addEventListener('loadedmetadata', () => {
			if (i === engine.index) engine.duration = el.duration;
		});
		el.addEventListener('play', () => {
			if (engine.mode === 'playlist' && i === engine.index) engine.isPlaying = true;
		});
		el.addEventListener('pause', () => {
			if (engine.mode === 'playlist' && i === engine.index) engine.isPlaying = false;
		});

		return { el, source, gain, panner };
	});

	engine.ready = true;
}

/** Unlock playback within a user gesture (browser autoplay policy / iOS). */
export function unlock(): void {
	if (!ctx || engine.unlocked) return;
	engine.unlocked = true;
	void ctx.resume().catch(() => {});
	// Prime only paused elements so we never disturb something already playing.
	for (const n of nodes) {
		if (n.el.paused) {
			n.el
				.play()
				.then(() => n.el.pause())
				.catch(() => {});
		}
	}
}

// --- Playlist renderer (gallery) ---

function applyPlaylistGains(): void {
	if (!ctx) return;
	const now = ctx.currentTime;
	nodes.forEach((n, i) => {
		n.gain.gain.setTargetAtTime(i === engine.index ? 1 : 0, now, 0.05);
		n.panner?.pan.setTargetAtTime(0, now, 0.05);
		if (i !== engine.index && !n.el.paused) n.el.pause();
	});
}

export function playTrack(i: number): void {
	initAudio();
	unlock();
	engine.mode = 'playlist';
	engine.index = i;
	engine.started = true;
	engine.duration = nodes[i]?.el.duration || 0;
	applyPlaylistGains();
	const n = nodes[i];
	if (!n) return;
	n.el.loop = false;
	void n.el.play().catch(() => {});
}

/** Select a playlist track without starting playback (e.g. when opening a paired work). */
export function selectTrack(i: number): void {
	initAudio();
	engine.mode = 'playlist';
	engine.index = i;
	engine.duration = nodes[i]?.el.duration || 0;
	applyPlaylistGains();
}

export function toggleHeroPlayback(): void {
	initAudio();
	unlock();
	engine.mode = 'playlist';
	const n = nodes[engine.index];
	if (!n) return;
	if (n.el.paused) {
		engine.started = true;
		applyPlaylistGains();
		n.el.loop = false;
		void n.el.play().catch(() => {});
	} else {
		n.el.pause();
	}
}

export function next(): void {
	playTrack((engine.index + 1) % tracks.length);
}

export function prev(): void {
	playTrack((engine.index - 1 + tracks.length) % tracks.length);
}

export function seek(ratio: number): void {
	const n = nodes[engine.index];
	if (!n) return;
	const d = n.el.duration;
	if (!d || !isFinite(d)) return;
	n.el.currentTime = Math.max(0, Math.min(d, ratio * d));
}

function onEnded(i: number): void {
	if (engine.mode === 'playlist' && i === engine.index) next();
}

// --- Spatial renderer (atelier) ---

export function enterSpatial(): void {
	initAudio();
	engine.mode = 'spatial';
	engine.near = { index: -1, level: 0 };
}

/** Drive one track's gain/pan from the atelier's per-frame proximity math. */
export function applySpatial(i: number, gain: number, pan: number): void {
	const n = nodes[i];
	if (!n || !ctx) return;
	const now = ctx.currentTime;
	n.gain.gain.setTargetAtTime(gain, now, 0.08);
	n.panner?.pan.setTargetAtTime(pan, now, 0.08);
	// Only let a track advance while audible; never loop. Hysteresis avoids flap.
	if (gain > 0.05) {
		if (n.el.paused) {
			if (n.el.ended) n.el.currentTime = 0;
			n.el.loop = false;
			void n.el.play().catch(() => {});
		}
	} else if (gain < 0.01 && !n.el.paused) {
		n.el.pause();
	}
}

/** Report the most-audible track for the immersive "now near" cue. */
export function setNear(index: number, level: number): void {
	engine.near = { index, level };
}

/** Leaving the atelier: silence spatial tracks and return to playlist mode. */
export function leaveSpatial(): void {
	silenceAll();
	engine.mode = 'playlist';
	engine.near = { index: -1, level: 0 };
}

function silenceAll(): void {
	if (!ctx) return;
	const now = ctx.currentTime;
	for (const n of nodes) {
		n.gain.gain.cancelScheduledValues(now);
		n.gain.gain.setValueAtTime(0, now);
		if (!n.el.paused) n.el.pause();
	}
	engine.isPlaying = false;
}

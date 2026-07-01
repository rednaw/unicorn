import { pickAudioSrc } from '$lib/audio-format';
import { audioDrawings, audioIndexForDrawing } from '$lib/content';
import { ATELIER_AUDIO } from './constants';
import type { SpatialMixResult } from './spatial-mix';

type TrackNodes = {
	el: HTMLAudioElement;
	gain: GainNode;
	panner: StereoPannerNode | null;
	/** When set, pause the element once this timestamp passes (lets the gain fade out first). */
	pauseAt: number | null;
};

/** Grace period before a faded-out (non-dominant) track is paused, so the ramp is audible. */
const FADE_OUT_PAUSE_SEC = 0.3;

/**
 * Spatial audio engine. Built as a factory but used as one shared instance (`audioEngine`)
 * because the autoplay/iOS unlock happens on the home door-click and must carry into the
 * atelier through the *same* `AudioContext` — SvelteKit's client-side navigation keeps the
 * document (and context) alive, so a fresh per-page instance would lose the unlock.
 *
 * Tracks are created lazily by proximity (`ensureTrack`) and only the dominant one is audible
 * (solo-near), so a floor of many recordings never downloads every `<audio>` upfront.
 */
export function createAudioEngine() {
	const engine = $state({
		ready: false,
		unlocked: false,
		/** When false, the spatial mix runs but tracks stay silent (overview / direct entry). */
		armed: false,
		near: { drawingId: null as string | null, level: 0 }
	});

	let ctx: AudioContext | undefined;
	let canPan = false;
	/** Lazily-created nodes keyed by audio index — only tracks the visitor approaches exist. */
	const nodes = new Map<number, TrackNodes>();
	/** iOS: indices that received a gesture play/pause once — never re-prime (that rewinds). */
	const primedIndices = new Set<number>();

	function initAudio(): void {
		if (engine.ready || typeof window === 'undefined') return;
		const Ctx: typeof AudioContext =
			window.AudioContext ??
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		ctx = new Ctx();
		canPan = typeof ctx.createStereoPanner === 'function';
		engine.ready = true;
	}

	/** Build a track's element + graph the first time it is needed; cached thereafter. */
	function ensureTrack(index: number): TrackNodes | null {
		if (!ctx) return null;
		const existing = nodes.get(index);
		if (existing) return existing;
		const d = audioDrawings[index];
		if (!d) return null;

		const el = new Audio(pickAudioSrc(d.track.src));
		el.preload = 'metadata';
		el.loop = false;
		const source = ctx.createMediaElementSource(el);
		const gain = ctx.createGain();
		gain.gain.value = 0;
		let panner: StereoPannerNode | null = null;
		if (canPan) {
			panner = ctx.createStereoPanner();
			source.connect(gain).connect(panner).connect(ctx.destination);
		} else {
			source.connect(gain).connect(ctx.destination);
		}
		el.pause();
		const track: TrackNodes = { el, gain, panner, pauseAt: null };
		nodes.set(index, track);
		return track;
	}

	function indicesFor(drawingIds: Iterable<string>): number[] {
		const out: number[] = [];
		for (const id of drawingIds) {
			const i = audioIndexForDrawing(id);
			if (i >= 0) out.push(i);
		}
		return out;
	}

	/**
	 * Resume the graph on a user gesture and (iOS) play/pause the named tracks once so they can
	 * be started programmatically later. `primeDrawingIds` are the pieces the visitor is near or
	 * entering — priming them within the gesture is what lets lazy tracks play on iOS.
	 */
	async function unlock(primeDrawingIds: string[] = []): Promise<void> {
		if (!ctx) return;
		if (!(await ensureContextRunning())) return;

		const firstUnlock = !engine.unlocked;
		if (firstUnlock) {
			engine.unlocked = true;
			// Inaudible blip to satisfy autoplay policy without advancing track positions.
			const buffer = ctx.createBuffer(1, 1, 22050);
			const src = ctx.createBufferSource();
			src.buffer = buffer;
			src.connect(ctx.destination);
			src.start();
		}

		const toPrime = indicesFor(primeDrawingIds).filter((i) => !primedIndices.has(i));
		if (toPrime.length) {
			await primeTracks(toPrime);
		}
	}

	async function ensureContextRunning(): Promise<boolean> {
		const audio = ctx;
		if (!audio) return false;
		if (audio.state === 'running') return true;
		try {
			await audio.resume();
			return audio.state !== 'suspended';
		} catch {
			return false;
		}
	}

	/** Play/pause each named track once during the unlock gesture — unlocks iOS media playback. */
	async function primeTracks(indices: number[]): Promise<void> {
		await Promise.all(
			indices.map((i) => {
				const n = ensureTrack(i);
				if (!n) return Promise.resolve();
				return n.el
					.play()
					.then(() => {
						n.el.pause();
						try {
							n.el.currentTime = 0;
						} catch {}
						primedIndices.add(i);
					})
					.catch(() => {});
			})
		);
	}

	function enterSpatial(): void {
		initAudio();
		engine.armed = false;
		engine.near = { drawingId: null, level: 0 };
		pauseAllTracks();
		// Each atelier visit starts recordings from the top — otherwise a track left
		// paused mid-recording would resume from its old position on the next visit.
		rewindAllTracks();
	}

	function rewindAllTracks(): void {
		for (const n of nodes.values()) {
			try {
				n.el.currentTime = 0;
			} catch {}
		}
	}

	/** Allow proximity audio — set on gallery focus entry or after the visitor explores. */
	function armSpatial(): void {
		engine.armed = true;
	}

	/**
	 * Solo-near: drive only the dominant (loudest-by-proximity) track audible; ramp every other
	 * existing track to silence and pause it after a short fade. Non-dominant tracks are never
	 * created here, so only pieces the visitor reaches ever fetch their recording.
	 */
	function applyMix(mix: SpatialMixResult): void {
		if (!ctx) return;
		const now = ctx.currentTime;
		const { rampTimeSec, playThreshold, pauseThreshold } = ATELIER_AUDIO;

		const dominantId = engine.armed ? mix.dominantAudioDrawingId : null;
		const dominantIndex = dominantId == null ? -1 : audioIndexForDrawing(dominantId);
		const dominantMix =
			dominantIndex >= 0 ? mix.drawings.find((d) => d.audioIndex === dominantIndex) : undefined;

		if (dominantMix) {
			const n = ensureTrack(dominantIndex);
			if (n) {
				n.pauseAt = null;
				n.gain.gain.setTargetAtTime(dominantMix.volume, now, rampTimeSec);
				n.panner?.pan.setTargetAtTime(dominantMix.pan, now, rampTimeSec);
				const canPlay = engine.unlocked && ctx.state === 'running';
				if (canPlay) {
					if (n.el.paused) {
						if (dominantMix.volume >= playThreshold) {
							if (n.el.ended) n.el.currentTime = 0;
							void n.el.play().catch(() => {});
						}
					} else if (dominantMix.volume < pauseThreshold) {
						n.el.pause();
					}
				} else if (!n.el.paused) {
					n.el.pause();
				}
			}
		}

		for (const [index, n] of nodes) {
			if (index === dominantIndex && dominantMix) continue;
			n.gain.gain.setTargetAtTime(0, now, rampTimeSec);
			if (n.el.paused) {
				n.pauseAt = null;
			} else if (n.pauseAt == null) {
				n.pauseAt = now + FADE_OUT_PAUSE_SEC;
			} else if (now >= n.pauseAt) {
				n.el.pause();
				n.pauseAt = null;
			}
		}
	}

	function pauseAllTracks(): void {
		for (const n of nodes.values()) {
			if (!n.el.paused) n.el.pause();
			n.pauseAt = null;
		}
		if (ctx) {
			const now = ctx.currentTime;
			for (const n of nodes.values()) {
				n.gain.gain.cancelScheduledValues(now);
				n.gain.gain.setValueAtTime(0, now);
			}
		}
	}

	function setNear(drawingId: string | null, level: number): void {
		if (engine.near.drawingId === drawingId && Math.abs(engine.near.level - level) < 0.02) {
			return;
		}
		engine.near = { drawingId, level };
	}

	function leaveSpatial(): void {
		pauseAllTracks();
		engine.armed = false;
		engine.near = { drawingId: null, level: 0 };
	}

	return {
		engine,
		initAudio,
		ensureTrack,
		unlock,
		enterSpatial,
		armSpatial,
		applyMix,
		pauseAllTracks,
		setNear,
		leaveSpatial
	};
}

export type AudioEngine = ReturnType<typeof createAudioEngine>;

/** Shared instance — see `createAudioEngine` for why this is a singleton rather than per-page. */
const audioEngine = createAudioEngine();

export const engine = audioEngine.engine;
export const initAudio = audioEngine.initAudio;
export const ensureTrack = audioEngine.ensureTrack;
export const unlock = audioEngine.unlock;
export const enterSpatial = audioEngine.enterSpatial;
export const armSpatial = audioEngine.armSpatial;
export const applyMix = audioEngine.applyMix;
export const pauseAllTracks = audioEngine.pauseAllTracks;
export const setNear = audioEngine.setNear;
export const leaveSpatial = audioEngine.leaveSpatial;

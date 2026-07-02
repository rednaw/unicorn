import { pickAudioSrc } from '$lib/audio-format';
import { audioDrawings, audioIndexForDrawing } from '$lib/content';
import { ATELIER_AUDIO } from './constants';
import type { SpatialMixResult } from './spatial-mix';

type TrackNodes = {
	el: HTMLAudioElement;
	gain: GainNode;
	panner: StereoPannerNode | null;
};

/**
 * Shared Web Audio graph for the whole visit (door → atelier).
 *
 * State:
 *   ready    — AudioContext exists
 *   unlocked — at least one user gesture ran unlock() (autoplay / iOS)
 *   armed    — spatial mix may be audible (explore or tap-focus)
 *
 * Playback: solo-near — only the dominant track gets gain; never pause() during mix
 * (Chromium incognito blocks play() after pause until a new gesture).
 */
function createAudioEngine() {
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
		el.preload = 'auto';
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
		const track: TrackNodes = { el, gain, panner };
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

		const indices = indicesFor(primeDrawingIds);
		const toPrime = indices.filter((i) => !primedIndices.has(i));
		if (toPrime.length) {
			await primeTracks(toPrime);
		}
		// Already-primed tracks skip primeTracks — still need play() in *this* gesture
		// or Chromium incognito will kill programmatic resume after buffer/policy timeout.
		if (indices.length) {
			await assertPlayback(indices);
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

	/** Play during the unlock gesture without rewinding — (re)binds autoplay for lazy tracks. */
	async function assertPlayback(indices: number[]): Promise<void> {
		await Promise.all(
			indices.map((i) => {
				const n = ensureTrack(i);
				if (!n) return Promise.resolve();
				return n.el.play().catch(() => {});
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
	 * Solo-near: drive only the dominant track audible; ramp others to silence via gain.
	 * Never pause `<audio>` here — after pause(), Chromium incognito blocks play() until
	 * a new gesture even when gain/volume recovers. pauseAllTracks() on leave only.
	 */
	function applyMix(mix: SpatialMixResult): void {
		if (!ctx) return;
		const now = ctx.currentTime;
		const { rampTimeSec, playThreshold } = ATELIER_AUDIO;

		const dominantId = engine.armed ? mix.dominantAudioDrawingId : null;
		const dominantIndex = dominantId == null ? -1 : audioIndexForDrawing(dominantId);
		const dominantMix =
			dominantIndex >= 0 ? mix.drawings.find((d) => d.audioIndex === dominantIndex) : undefined;

		const canPlay = engine.unlocked && ctx.state === 'running';

		if (dominantMix) {
			const n = ensureTrack(dominantIndex);
			if (n) {
				const audibility = canPlay ? dominantMix.volume : 0;
				n.gain.gain.setTargetAtTime(audibility, now, rampTimeSec);
				n.panner?.pan.setTargetAtTime(dominantMix.pan, now, rampTimeSec);
				if (canPlay && n.el.paused && dominantMix.volume >= playThreshold) {
					if (n.el.ended) n.el.currentTime = 0;
					void n.el.play().catch(() => {});
				}
			}
		}

		for (const [index, n] of nodes) {
			if (index === dominantIndex && dominantMix) continue;
			n.gain.gain.setTargetAtTime(0, now, rampTimeSec);
		}
	}

	function pauseAllTracks(): void {
		for (const n of nodes.values()) {
			if (!n.el.paused) n.el.pause();
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

/** Shared instance — see `createAudioEngine` for why this is a singleton rather than per-page. */
const audioEngine = createAudioEngine();

export const engine = audioEngine.engine;
export const initAudio = audioEngine.initAudio;
export const unlock = audioEngine.unlock;
export const enterSpatial = audioEngine.enterSpatial;
export const armSpatial = audioEngine.armSpatial;
export const applyMix = audioEngine.applyMix;
export const setNear = audioEngine.setNear;
export const leaveSpatial = audioEngine.leaveSpatial;

import { pickAudioSrc } from '$lib/audio-format';
import { audioDrawings, audioIndexForDrawing } from '$lib/content';
import { ATELIER_AUDIO } from './constants';

/**
 * Single-track explicit listen player — one `<audio>` element, gesture-owned `play()`.
 * Shared `AudioContext` survives door → atelier navigation.
 */
function createAudioPlayer() {
	const player = $state({
		ready: false,
		unlocked: false,
		drawingId: null as string | null
	});

	let ctx: AudioContext | undefined;
	let el: HTMLAudioElement | undefined;
	let gain: GainNode | undefined;
	let loadedDrawingId: string | null = null;
	let stopTimer: ReturnType<typeof setTimeout> | undefined;
	let onEndedCb: (() => void) | undefined;
	/** Bumps on each play/stop so async metadata handlers from older calls are ignored. */
	let playGeneration = 0;
	/** Resume position per drawing when switching to another piece mid-recording. */
	const savedPositions = new Map<string, number>();

	const { crossfadeMs } = ATELIER_AUDIO;

	function initAudio(): void {
		if (player.ready || typeof window === 'undefined') return;
		const Ctx: typeof AudioContext =
			window.AudioContext ??
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		ctx = new Ctx();
		player.ready = true;
	}

	function ensureGraph(): void {
		if (!ctx || el) return;
		el = new Audio();
		// Metadata only until play — avoids read-ahead on long recordings.
		el.preload = 'metadata';
		el.loop = false;
		const source = ctx.createMediaElementSource(el);
		gain = ctx.createGain();
		gain.gain.value = 0;
		if (typeof ctx.createStereoPanner === 'function') {
			const panner = ctx.createStereoPanner();
			source.connect(gain).connect(panner).connect(ctx.destination);
		} else {
			source.connect(gain).connect(ctx.destination);
		}
		el.addEventListener('ended', () => {
			if (gain && ctx) {
				gain.gain.setValueAtTime(0, ctx.currentTime);
			}
			if (loadedDrawingId) {
				savedPositions.delete(loadedDrawingId);
			}
			onEndedCb?.();
		});
	}

	function ensureContextRunning(): void {
		if (!ctx) return;
		if (ctx.state === 'suspended') {
			void ctx.resume();
		}
	}

	function unlockContext(): void {
		if (!ctx || player.unlocked) return;
		player.unlocked = true;
		const buffer = ctx.createBuffer(1, 1, 22050);
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.connect(ctx.destination);
		src.start();
	}

	async function prepareContext(): Promise<void> {
		initAudio();
		if (!ctx) return;
		if (ctx.state === 'suspended') {
			try {
				await ctx.resume();
			} catch {}
		}
		unlockContext();
	}

	function clearStopTimer(): void {
		if (stopTimer) {
			clearTimeout(stopTimer);
			stopTimer = undefined;
		}
	}

	function setDrawingId(drawingId: string | null): void {
		loadedDrawingId = drawingId;
		player.drawingId = drawingId;
	}

	function clearActiveSession(): void {
		player.drawingId = null;
	}

	function savePlaybackPosition(drawingId: string): void {
		if (!el || el.ended) return;
		savedPositions.set(drawingId, el.currentTime);
	}

	function invalidatePendingPlay(): void {
		playGeneration += 1;
	}

	/**
	 * Start or resume a drawing's track in the current gesture.
	 * Rewinds only for a new piece, explicit replay (`fromStart`), or after `ended`.
	 */
	function playDrawing(drawingId: string, opts: { fromStart?: boolean } = {}): void {
		initAudio();
		ensureGraph();
		if (!ctx || !el || !gain) return;

		ensureContextRunning();
		unlockContext();
		el.preload = 'auto';

		const index = audioIndexForDrawing(drawingId);
		if (index < 0) return;
		const drawing = audioDrawings[index];
		if (!drawing) return;

		const gen = ++playGeneration;
		clearStopTimer();

		const src = pickAudioSrc(drawing.track.src);
		const now = ctx.currentTime;
		const fadeSec = crossfadeMs / 1000;
		const fromStart = opts.fromStart === true;
		const sameLoaded = loadedDrawingId === drawingId;
		const stale = () => gen !== playGeneration;

		const fadeIn = () => {
			if (stale() || !gain || !ctx) return;
			const t = ctx.currentTime;
			gain.gain.cancelScheduledValues(t);
			gain.gain.setValueAtTime(gain.gain.value, t);
			gain.gain.linearRampToValueAtTime(1, t + fadeSec);
		};

		if (sameLoaded && !fromStart && !el.ended && !el.paused) {
			gain.gain.cancelScheduledValues(now);
			if (gain.gain.value < 0.99) {
				gain.gain.setValueAtTime(gain.gain.value, now);
				gain.gain.linearRampToValueAtTime(1, now + fadeSec);
			}
			setDrawingId(drawingId);
			return;
		}

		if (loadedDrawingId && loadedDrawingId !== drawingId) {
			savePlaybackPosition(loadedDrawingId);
		}

		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(0, now);

		let startAt = 0;
		if (fromStart || (sameLoaded && el.ended)) {
			startAt = 0;
			savedPositions.delete(drawingId);
		} else if (sameLoaded && el.paused && !el.ended) {
			startAt = el.currentTime;
		} else {
			startAt = savedPositions.get(drawingId) ?? 0;
		}

		setDrawingId(drawingId);

		if (!sameLoaded) {
			el.pause();
			el.removeAttribute('src');
			el.load();
			let readyHandled = false;
			const onReady = () => {
				if (stale() || readyHandled || !el) return;
				readyHandled = true;
				el.removeEventListener('loadedmetadata', onReady);
				el.removeEventListener('error', onReady);
				if (startAt > 0.05) {
					try {
						el.currentTime = startAt;
					} catch {}
				}
				fadeIn();
			};
			el.addEventListener('loadedmetadata', onReady);
			el.addEventListener('error', onReady);
			el.src = src;
			void el.play().catch(() => {});
			if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
				onReady();
			}
			return;
		}

		void el.play().catch(() => {});
		if (fromStart) {
			try {
				el.currentTime = 0;
			} catch {}
		} else if (startAt > 0.05) {
			try {
				el.currentTime = startAt;
			} catch {}
		}
		fadeIn();
	}

	/** Fade out then pause. Preserves resume position unless `reset` (leave atelier / fresh entry). */
	function stop(opts: { fadeMs?: number; reset?: boolean; onDone?: () => void } = {}): void {
		invalidatePendingPlay();
		const gen = playGeneration;
		clearStopTimer();
		const fadeMs = opts.fadeMs ?? crossfadeMs;
		const reset = opts.reset === true;
		const onDone = opts.onDone;

		if (!ctx || !el || !gain) {
			if (reset) setDrawingId(null);
			else clearActiveSession();
			if (gen === playGeneration) onDone?.();
			return;
		}

		const finish = () => {
			if (!el || !gain || !ctx) return;
			if (loadedDrawingId && !el.ended) {
				if (reset) {
					savedPositions.delete(loadedDrawingId);
				} else {
					savedPositions.set(loadedDrawingId, el.currentTime);
				}
			}
			el.pause();
			if (reset) {
				try {
					el.currentTime = 0;
				} catch {}
				el.removeAttribute('src');
				el.load();
				el.preload = 'metadata';
				setDrawingId(null);
			} else {
				clearActiveSession();
			}
			gain.gain.cancelScheduledValues(ctx.currentTime);
			gain.gain.setValueAtTime(0, ctx.currentTime);
			if (gen === playGeneration) onDone?.();
		};

		if (el.paused || el.ended || fadeMs <= 0) {
			finish();
			return;
		}

		const now = ctx.currentTime;
		const fadeSec = fadeMs / 1000;
		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(gain.gain.value, now);
		gain.gain.linearRampToValueAtTime(0, now + fadeSec);

		stopTimer = setTimeout(() => {
			stopTimer = undefined;
			finish();
		}, fadeMs);
	}

	function setOnEnded(cb: (() => void) | undefined): void {
		onEndedCb = cb;
	}

	function enterAtelier(): void {
		initAudio();
		stop({ fadeMs: 0, reset: true });
	}

	function leaveAtelier(): void {
		clearStopTimer();
		stop({ fadeMs: 0, reset: true });
	}

	/** @internal Vitest-only — drops the audio graph so each case starts clean. */
	function resetForTests(): void {
		clearStopTimer();
		invalidatePendingPlay();
		onEndedCb = undefined;
		savedPositions.clear();
		loadedDrawingId = null;
		if (el) {
			el.pause();
			try {
				el.currentTime = 0;
			} catch {}
			el.removeAttribute('src');
			el.load();
		}
		el = undefined;
		gain = undefined;
		ctx = undefined;
		player.ready = false;
		player.unlocked = false;
		player.drawingId = null;
	}

	return {
		player,
		initAudio,
		prepareContext,
		playDrawing,
		stop,
		setOnEnded,
		enterAtelier,
		leaveAtelier,
		resetForTests
	};
}

const audioPlayer = createAudioPlayer();

export const player = audioPlayer.player;
export const initAudio = audioPlayer.initAudio;
export const prepareContext = audioPlayer.prepareContext;
export const playDrawing = audioPlayer.playDrawing;
export const stop = audioPlayer.stop;
export const setOnEnded = audioPlayer.setOnEnded;
export const enterAtelier = audioPlayer.enterAtelier;
export const leaveAtelier = audioPlayer.leaveAtelier;
export const resetAudioPlayerForTests = audioPlayer.resetForTests;

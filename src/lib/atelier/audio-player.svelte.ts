import { pickAudioSrc } from '$lib/audio-format';
import { audioDrawings, audioIndexForDrawing } from '$lib/content';
import { ATELIER_AUDIO } from './constants';
import { NEEDLE_DROP_SRC, NEEDLE_LIFT_SRC } from './needle-sfx';

/**
 * Single-track explicit listen player — one `<audio>` element, gesture-owned `play()`.
 * Shared `AudioContext` survives door → atelier navigation.
 * Vinyl needle SFX are decoded Web Audio buffers (drop on fresh start, lift on natural end).
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
	let needleGain: GainNode | undefined;
	let loadedDrawingId: string | null = null;
	let stopTimer: ReturnType<typeof setTimeout> | undefined;
	let musicIntroTimer: ReturnType<typeof setTimeout> | undefined;
	let musicEndHandoffTimer: ReturnType<typeof setTimeout> | undefined;
	/** Lift already started for this playthrough (near-end handoff) — skip a second cue on `ended`. */
	let liftPlayed = false;
	/** Listening `onEnded` already fired for this playthrough (after lift). */
	let listeningEndSent = false;
	let onEndedCb: (() => void) | undefined;
	/** Bumps on each play/stop so async metadata handlers from older calls are ignored. */
	let playGeneration = 0;
	/** Resume position per drawing when switching to another piece mid-recording. */
	const savedPositions = new Map<string, number>();

	/** `undefined` = not loaded yet; `null` = fetch/decode failed (skip silently). */
	let dropBuffer: AudioBuffer | null | undefined;
	let liftBuffer: AudioBuffer | null | undefined;
	let needleLoad: Promise<void> | undefined;
	let activeNeedle: AudioBufferSourceNode | undefined;
	/** Guards async decode so a late buffer never plays after stop / a newer cue. */
	let needleIntent: 'drop' | 'lift' | null = null;

	const { crossfadeMs, needleGain: needleGainLevel, needleMusicOverlapMs } = ATELIER_AUDIO;

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
		needleGain = ctx.createGain();
		needleGain.gain.value = needleGainLevel;
		if (typeof ctx.createStereoPanner === 'function') {
			const panner = ctx.createStereoPanner();
			source.connect(gain).connect(panner).connect(ctx.destination);
			needleGain.connect(panner);
		} else {
			source.connect(gain).connect(ctx.destination);
			needleGain.connect(ctx.destination);
		}
		el.addEventListener('ended', () => {
			clearMusicEndHandoffTimer();
			if (gain && ctx) {
				gain.gain.cancelScheduledValues(ctx.currentTime);
				gain.gain.setValueAtTime(0, ctx.currentTime);
			}
			if (loadedDrawingId) {
				savedPositions.delete(loadedDrawingId);
			}
			if (liftPlayed) {
				// Handoff already started the lift; plaque waits for that cue's onDone.
				// If the lift was shorter than the overlap and already notified, just clear.
				if (listeningEndSent) liftPlayed = false;
				return;
			}
			liftPlayed = true;
			listeningEndSent = false;
			playNeedleLift(() => {
				sendListeningEnded();
				liftPlayed = false;
			});
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

	async function decodeNeedle(m4aSrc: string): Promise<AudioBuffer | null> {
		if (!ctx) return null;
		try {
			const res = await fetch(pickAudioSrc(m4aSrc));
			if (!res.ok) return null;
			const data = await res.arrayBuffer();
			return await ctx.decodeAudioData(data.slice(0));
		} catch {
			return null;
		}
	}

	function ensureNeedleBuffers(): Promise<void> {
		if (!ctx) return Promise.resolve();
		if (dropBuffer !== undefined && liftBuffer !== undefined) return Promise.resolve();
		if (needleLoad) return needleLoad;
		needleLoad = (async () => {
			if (dropBuffer === undefined) dropBuffer = await decodeNeedle(NEEDLE_DROP_SRC);
			if (liftBuffer === undefined) liftBuffer = await decodeNeedle(NEEDLE_LIFT_SRC);
		})().finally(() => {
			needleLoad = undefined;
		});
		return needleLoad;
	}

	function stopNeedle(): void {
		needleIntent = null;
		if (!activeNeedle) return;
		const src = activeNeedle;
		activeNeedle = undefined;
		// Drop onended so a forced stop never marks the listening session ended.
		src.onended = null;
		try {
			src.stop();
		} catch {}
		try {
			src.disconnect();
		} catch {}
	}

	function playNeedleBuffer(
		buffer: AudioBuffer | null | undefined,
		onDone?: () => void
	): void {
		if (!ctx || !needleGain || !buffer) {
			onDone?.();
			return;
		}
		if (activeNeedle) {
			const prev = activeNeedle;
			activeNeedle = undefined;
			prev.onended = null;
			try {
				prev.stop();
			} catch {}
			try {
				prev.disconnect();
			} catch {}
		}
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.connect(needleGain);
		src.onended = () => {
			if (activeNeedle === src) activeNeedle = undefined;
			onDone?.();
		};
		activeNeedle = src;
		try {
			src.start();
		} catch {
			activeNeedle = undefined;
			onDone?.();
		}
	}

	function playNeedleDrop(): void {
		needleIntent = 'drop';
		if (dropBuffer !== undefined) {
			playNeedleBuffer(dropBuffer);
			return;
		}
		void ensureNeedleBuffers().then(() => {
			if (needleIntent !== 'drop') return;
			playNeedleBuffer(dropBuffer);
		});
	}

	/** Needle-lift, then `onDone` when the cue finishes (or immediately if unavailable). */
	function playNeedleLift(onDone?: () => void): void {
		needleIntent = 'lift';
		const run = (buffer: AudioBuffer | null | undefined) => {
			if (needleIntent !== 'lift') return;
			playNeedleBuffer(buffer, onDone);
		};
		if (liftBuffer !== undefined) {
			run(liftBuffer);
			return;
		}
		void ensureNeedleBuffers().then(() => run(liftBuffer));
	}

	function clearStopTimer(): void {
		if (stopTimer) {
			clearTimeout(stopTimer);
			stopTimer = undefined;
		}
	}

	function clearMusicIntroTimer(): void {
		if (musicIntroTimer) {
			clearTimeout(musicIntroTimer);
			musicIntroTimer = undefined;
		}
	}

	function clearMusicEndHandoffTimer(): void {
		if (musicEndHandoffTimer) {
			clearTimeout(musicEndHandoffTimer);
			musicEndHandoffTimer = undefined;
		}
	}

	function sendListeningEnded(): void {
		if (listeningEndSent) return;
		listeningEndSent = true;
		onEndedCb?.();
	}

	/** Fade music out over the overlap window and start the needle-lift. */
	function beginNeedleLiftHandoff(stale: () => boolean): void {
		if (stale() || !gain || !ctx || liftPlayed) return;
		liftPlayed = true;
		listeningEndSent = false;
		const t = ctx.currentTime;
		const fadeSec = needleMusicOverlapMs / 1000;
		gain.gain.cancelScheduledValues(t);
		gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.001), t);
		gain.gain.linearRampToValueAtTime(0, t + Math.max(fadeSec, 0.05));
		// Plaque / listening session stay "playing" until the lift cue finishes.
		playNeedleLift(() => sendListeningEnded());
	}

	/**
	 * Arm the end-of-record handoff once music is audible: lift starts in the last
	 * `needleMusicOverlapMs` while gain fades out — mirror of the drop intro.
	 */
	function scheduleMusicEndHandoff(stale: () => boolean): void {
		clearMusicEndHandoffTimer();
		liftPlayed = false;
		listeningEndSent = false;
		if (!el) return;

		const arm = () => {
			if (stale() || !el) return;
			const duration = el.duration;
			if (!Number.isFinite(duration) || duration <= 0) {
				const onDuration = () => {
					el?.removeEventListener('durationchange', onDuration);
					el?.removeEventListener('loadedmetadata', onDuration);
					if (!stale()) scheduleMusicEndHandoff(stale);
				};
				el.addEventListener('durationchange', onDuration);
				el.addEventListener('loadedmetadata', onDuration);
				return;
			}

			const remainingMs = Math.max(0, (duration - el.currentTime) * 1000);
			const delay = Math.max(0, remainingMs - needleMusicOverlapMs);
			musicEndHandoffTimer = setTimeout(() => {
				musicEndHandoffTimer = undefined;
				beginNeedleLiftHandoff(stale);
			}, delay);
		};

		arm();
	}

	/**
	 * Fresh start: needle drop first, then music (tiny overlap). `el.play()` already
	 * ran in the gesture — we pause at 0 until the handoff so the recording doesn't
	 * burn its opening under the drop.
	 */
	function scheduleMusicAfterDrop(stale: () => boolean, onAudible: () => void): void {
		clearMusicIntroTimer();

		const arm = () => {
			if (stale() || !el || !gain || !ctx) return;

			const dropMs = dropBuffer ? dropBuffer.duration * 1000 : 0;
			const delay = Math.max(0, dropMs - needleMusicOverlapMs);

			el.pause();
			try {
				el.currentTime = 0;
			} catch {}
			gain.gain.cancelScheduledValues(ctx.currentTime);
			gain.gain.setValueAtTime(0, ctx.currentTime);

			if (delay <= 0) {
				void el.play().catch(() => {});
				onAudible();
				return;
			}

			musicIntroTimer = setTimeout(() => {
				musicIntroTimer = undefined;
				if (stale() || !el) return;
				try {
					el.currentTime = 0;
				} catch {}
				void el.play().catch(() => {});
				onAudible();
			}, delay);
		};

		if (dropBuffer !== undefined) {
			arm();
			return;
		}
		void ensureNeedleBuffers().then(arm);
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
		void ensureNeedleBuffers();
		el.preload = 'auto';

		const index = audioIndexForDrawing(drawingId);
		if (index < 0) return;
		const drawing = audioDrawings[index];
		if (!drawing) return;

		const gen = ++playGeneration;
		clearStopTimer();
		clearMusicIntroTimer();
		clearMusicEndHandoffTimer();
		stopNeedle();
		liftPlayed = false;
		listeningEndSent = false;

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

		const onMusicAudible = () => {
			fadeIn();
			scheduleMusicEndHandoff(stale);
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

		const resuming = sameLoaded && el.paused && !el.ended && !fromStart;
		const freshStart = !resuming && startAt < 0.05;
		if (freshStart) {
			playNeedleDrop();
		}

		const bringMusicIn = freshStart
			? () => scheduleMusicAfterDrop(stale, onMusicAudible)
			: onMusicAudible;

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
				bringMusicIn();
			};
			el.addEventListener('loadedmetadata', onReady);
			el.addEventListener('error', onReady);
			el.src = src;
			// Gesture-owned play — unlocks the element; bringMusicIn may pause until the drop handoff.
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
		bringMusicIn();
	}

	/** Fade out then pause. Preserves resume position unless `reset` (leave atelier / fresh entry). */
	function stop(opts: { fadeMs?: number; reset?: boolean; onDone?: () => void } = {}): void {
		invalidatePendingPlay();
		const gen = playGeneration;
		clearStopTimer();
		clearMusicIntroTimer();
		clearMusicEndHandoffTimer();
		stopNeedle();
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
		void ensureNeedleBuffers();
	}

	function leaveAtelier(): void {
		clearStopTimer();
		clearMusicIntroTimer();
		clearMusicEndHandoffTimer();
		stopNeedle();
		stop({ fadeMs: 0, reset: true });
	}

	/** @internal Vitest-only — drops the audio graph so each case starts clean. */
	function resetForTests(): void {
		clearStopTimer();
		clearMusicIntroTimer();
		clearMusicEndHandoffTimer();
		stopNeedle();
		invalidatePendingPlay();
		onEndedCb = undefined;
		savedPositions.clear();
		loadedDrawingId = null;
		dropBuffer = undefined;
		liftBuffer = undefined;
		needleLoad = undefined;
		needleIntent = null;
		liftPlayed = false;
		listeningEndSent = false;
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
		needleGain = undefined;
		ctx = undefined;
		player.ready = false;
		player.unlocked = false;
		player.drawingId = null;
	}

	/** @internal Vitest-only — skip fetch/decode and install ready buffers. */
	function setNeedleBuffersForTests(drop: AudioBuffer | null, lift: AudioBuffer | null): void {
		dropBuffer = drop;
		liftBuffer = lift;
		needleLoad = undefined;
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
		resetForTests,
		setNeedleBuffersForTests
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
export const setNeedleBuffersForTests = audioPlayer.setNeedleBuffersForTests;

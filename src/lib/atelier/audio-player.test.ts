import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audioMocks } from '$test/setup';
import { flushMicrotasks } from '$test/mock-audio';
import { ATELIER_AUDIO } from './constants';
import {
	initAudio,
	playDrawing,
	player,
	resetAudioPlayerForTests,
	setNeedleBuffersForTests,
	setOnEnded,
	stop
} from './audio-player.svelte';

/** 1s drop → music handoff at 1s − overlap. */
const fakeBuffer = { duration: 1, length: 1, numberOfChannels: 1, sampleRate: 44100 } as AudioBuffer;

function needleStarts() {
	// Unlock beep uses createBuffer() (no duration); SFX use decoded buffers.
	return audioMocks.bufferSources.filter(
		(s) =>
			s.buffer != null &&
			'duration' in s.buffer &&
			s.start.mock.calls.length > 0
	);
}

describe('audio-player', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		audioMocks.instances.length = 0;
		audioMocks.bufferSources.length = 0;
		resetAudioPlayerForTests();
		setOnEnded(undefined);
		setNeedleBuffersForTests(fakeBuffer, fakeBuffer);
	});

	afterEach(() => {
		resetAudioPlayerForTests();
	});

	it('ignores playDrawing for drawings without audio', async () => {
		playDrawing('bela-bartok');
		await flushMicrotasks();
		expect(player.drawingId).toBeNull();
	});

	it('loads and marks an audio drawing after metadata is ready', async () => {
		playDrawing('maskers');
		await flushMicrotasks();
		const el = audioMocks.instances[0]!;
		expect(player.drawingId).toBe('maskers');
		expect(el.src).toContain('chopin-ballade');
		expect(el.preload).toBe('auto');
	});

	it('reset stop clears the active session and releases src', async () => {
		playDrawing('maskers');
		await flushMicrotasks();
		const el = audioMocks.instances[0]!;
		stop({ fadeMs: 0, reset: true });
		expect(player.drawingId).toBeNull();
		expect(el.src).toBe('');
		expect(el.preload).toBe('metadata');
	});

	it('stop without reset preserves resume position for the same piece', async () => {
		playDrawing('maskers');
		await flushMicrotasks();
		const el = audioMocks.instances[0]!;
		el.currentTime = 42;

		stop({ fadeMs: 0 });
		expect(player.drawingId).toBeNull();

		playDrawing('maskers');
		await flushMicrotasks();
		expect(el.currentTime).toBe(42);
	});

	it('fromStart rewinds a piece after it has ended', async () => {
		playDrawing('maskers');
		await flushMicrotasks();
		const el = audioMocks.instances[0]!;
		el.currentTime = 55;
		el.ended = true;
		el.paused = true;

		playDrawing('maskers', { fromStart: true });
		await flushMicrotasks();
		expect(el.currentTime).toBe(0);
	});

	it('saves the previous track position when switching pieces', async () => {
		playDrawing('maskers');
		await flushMicrotasks();
		const el = audioMocks.instances[0]!;
		el.currentTime = 12;

		playDrawing('claudio-abbado');
		await flushMicrotasks();
		expect(player.drawingId).toBe('claudio-abbado');
		expect(el.src).toContain('brahms');

		stop({ fadeMs: 0 });
		playDrawing('maskers');
		await flushMicrotasks();
		expect(el.currentTime).toBe(12);
	});

	it('ignores stale metadata callbacks after a newer play request', async () => {
		playDrawing('maskers');
		playDrawing('claudio-abbado');
		await flushMicrotasks();
		expect(player.drawingId).toBe('claudio-abbado');
		expect(audioMocks.instances[0]!.src).toContain('brahms');
	});

	it('fade stop invokes onDone after the fade duration', async () => {
		playDrawing('maskers');
		await flushMicrotasks();
		const el = audioMocks.instances[0]!;
		el.paused = false;

		const onDone = vi.fn();
		stop({ fadeMs: 300, onDone });
		expect(onDone).not.toHaveBeenCalled();

		vi.advanceTimersByTime(300);
		expect(onDone).toHaveBeenCalledOnce();
		expect(player.drawingId).toBeNull();
	});

	it('initAudio marks the player ready in a browser environment', () => {
		initAudio();
		expect(player.ready).toBe(true);
	});

	it('plays a needle drop on a fresh start, not on resume', async () => {
		playDrawing('maskers');
		await flushMicrotasks();

		expect(needleStarts().length).toBe(1);

		const el = audioMocks.instances[0]!;
		// Finish the drop handoff so the element is playing before we pause mid-track.
		vi.advanceTimersByTime(1000);
		el.currentTime = 12;
		stop({ fadeMs: 0 });
		audioMocks.bufferSources.length = 0;

		playDrawing('maskers');
		await flushMicrotasks();

		expect(needleStarts().length).toBe(0);
	});

	it('holds the music until the needle-drop handoff', async () => {
		playDrawing('maskers');
		await flushMicrotasks();

		const el = audioMocks.instances[0]!;
		expect(el.paused).toBe(true);

		const delay = 1000 - ATELIER_AUDIO.needleMusicOverlapMs;
		vi.advanceTimersByTime(delay - 1);
		expect(el.paused).toBe(true);

		vi.advanceTimersByTime(1);
		expect(el.paused).toBe(false);
	});

	it('fades into needle-lift near the end of the track, not on stop', async () => {
		const onEnded = vi.fn();
		setOnEnded(onEnded);

		playDrawing('maskers');
		await flushMicrotasks();

		const el = audioMocks.instances[0]!;
		el.duration = 5;

		// Reach the drop→music handoff so the end handoff arms with known duration.
		const introDelay = 1000 - ATELIER_AUDIO.needleMusicOverlapMs;
		vi.advanceTimersByTime(introDelay);
		await flushMicrotasks();
		audioMocks.bufferSources.length = 0;

		const toLift = 5000 - ATELIER_AUDIO.needleMusicOverlapMs;
		vi.advanceTimersByTime(toLift - 1);
		expect(needleStarts().length).toBe(0);

		vi.advanceTimersByTime(1);
		expect(needleStarts().length).toBe(1);
		expect(onEnded).not.toHaveBeenCalled();

		// Music element ends while lift is still playing — plaque stays up.
		el.dispatchEvent(new Event('ended'));
		await flushMicrotasks();
		expect(onEnded).not.toHaveBeenCalled();

		// Lift cue finishes → listening/plaque may reset.
		const liftSrc = needleStarts().at(-1)!;
		liftSrc.onended?.();
		expect(onEnded).toHaveBeenCalledOnce();

		// Stop must not play lift.
		audioMocks.bufferSources.length = 0;
		el.paused = false;
		el.ended = false;
		playDrawing('maskers');
		await flushMicrotasks();
		audioMocks.bufferSources.length = 0;
		stop({ fadeMs: 0 });
		await flushMicrotasks();
		expect(needleStarts().length).toBe(0);
	});
});

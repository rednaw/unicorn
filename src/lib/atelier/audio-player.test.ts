import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audioMocks } from '$test/setup';
import { flushMicrotasks } from '$test/mock-audio';
import { ATELIER_AUDIO } from './constants';
import {
	initAudio,
	playDrawing,
	player,
	resetAudioPlayerForTests,
	setOnEnded,
	stop
} from './audio-player.svelte';

describe('audio-player', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		audioMocks.instances.length = 0;
		audioMocks.bufferSources.length = 0;
		resetAudioPlayerForTests();
		setOnEnded(undefined);
	});

	afterEach(() => {
		resetAudioPlayerForTests();
		vi.useRealTimers();
	});

	it('ignores playDrawing for drawings without audio', async () => {
		playDrawing('torso');
		await flushMicrotasks();
		expect(player.drawingId).toBeNull();
	});

	it('loads the vinyl mix after metadata is ready', async () => {
		playDrawing('maskers');
		await flushMicrotasks();
		const el = audioMocks.instances[0]!;
		expect(player.drawingId).toBe('maskers');
		expect(el.src).toContain('chopin-ballade');
		expect(el.src).toContain('.vinyl.');
		expect(el.preload).toBe('auto');
		expect(el.paused).toBe(false);
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
		expect(el.src).toContain('.vinyl.');

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
		stop({ fadeMs: ATELIER_AUDIO.crossfadeMs, onDone });
		expect(onDone).not.toHaveBeenCalled();

		vi.advanceTimersByTime(ATELIER_AUDIO.crossfadeMs);
		expect(onDone).toHaveBeenCalledOnce();
		expect(player.drawingId).toBeNull();
	});

	it('initAudio marks the player ready in a browser environment', () => {
		initAudio();
		expect(player.ready).toBe(true);
	});

	it('notifies listening when the vinyl mix ends', async () => {
		const onEnded = vi.fn();
		setOnEnded(onEnded);

		playDrawing('maskers');
		await flushMicrotasks();

		const el = audioMocks.instances[0]!;
		el.dispatchEvent(new Event('ended'));
		await flushMicrotasks();
		expect(onEnded).toHaveBeenCalledOnce();
	});
});

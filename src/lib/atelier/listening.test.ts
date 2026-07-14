import { describe, expect, it } from 'vitest';
import { createListening } from './listening.svelte';

describe('createListening', () => {
	it('tracks focus, pause, resume, and end phases', () => {
		const listening = createListening();

		listening.focus('maskers');
		expect(listening.drawingId).toBe('maskers');
		expect(listening.phase).toBe('playing');
		expect(listening.isPlaying('maskers')).toBe(true);

		listening.pause();
		expect(listening.phase).toBe('paused');
		expect(listening.isPlaying('maskers')).toBe(false);

		listening.resume();
		expect(listening.phase).toBe('playing');

		listening.markEnded();
		expect(listening.phase).toBe('ended');
		expect(listening.hudEnded).toBe(true);
	});

	it('ignores markEnded when not playing', () => {
		const listening = createListening();
		listening.focus('maskers');
		listening.pause();
		listening.markEnded();
		expect(listening.phase).toBe('paused');
	});

	it('clear resets the session', () => {
		const listening = createListening();
		listening.focus('maskers');
		listening.clear();
		expect(listening.drawingId).toBeNull();
		expect(listening.phase).toBeNull();
		expect(listening.hudDrawingId).toBeNull();
	});
});

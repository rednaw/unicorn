import { describe, expect, it } from 'vitest';
import {
	DEFAULT_DRAWING_WIDTH,
	DRAWING_SLOT_PADDING_X,
	SHARP_DPR,
	type Drawing
} from '$lib/content-types';
import {
	audioDrawingsFrom,
	audioIndexMapFrom,
	maxSharpZoomForDrawing
} from './content-derive';
import { mockDrawing, mockTrack } from '../test/fixtures';

describe('audioDrawingsFrom', () => {
	it('returns only drawings with a track', () => {
		const flat: Drawing[] = [
			mockDrawing({ id: 'a', track: mockTrack({ id: 't-a' }) }),
			mockDrawing({ id: 'b' }),
			mockDrawing({ id: 'c', track: mockTrack({ id: 't-c' }) })
		];
		const audio = audioDrawingsFrom(flat);
		expect(audio.map((d) => d.id)).toEqual(['a', 'c']);
	});
});

describe('audioIndexMapFrom', () => {
	it('maps drawing ids to indices in the audio list', () => {
		const flat: Drawing[] = [
			mockDrawing({ id: 'silent' }),
			mockDrawing({ id: 'one', track: mockTrack({ id: 't-1' }) }),
			mockDrawing({ id: 'two', track: mockTrack({ id: 't-2' }) })
		];
		const map = audioIndexMapFrom(flat);
		expect(map.get('one')).toBe(0);
		expect(map.get('two')).toBe(1);
		expect(map.has('silent')).toBe(false);
	});
});

describe('maxSharpZoomForDrawing', () => {
	it('uses slot inner width and SHARP_DPR', () => {
		const d = mockDrawing({ id: 'x', srcWidth: 3000, width: 300 });
		const inner = 300 - DRAWING_SLOT_PADDING_X;
		expect(maxSharpZoomForDrawing(d)).toBeCloseTo(3000 / (inner * SHARP_DPR));
	});

	it('falls back to DEFAULT_DRAWING_WIDTH when width is omitted', () => {
		const d = mockDrawing({ id: 'x', srcWidth: 2400, width: undefined });
		const inner = DEFAULT_DRAWING_WIDTH - DRAWING_SLOT_PADDING_X;
		expect(maxSharpZoomForDrawing(d)).toBeCloseTo(2400 / (inner * SHARP_DPR));
	});
});

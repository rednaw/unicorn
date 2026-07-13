import { describe, expect, it } from 'vitest';
import {
	ATELIER_PORTRAIT_MAX_WIDTH,
	computeAtelierCanvas,
	layoutPos,
	resolveLayoutMode
} from './atelier-layout';
import { drawings } from '$lib/content';

describe('resolveLayoutMode', () => {
	it('uses portrait on narrow tall viewports', () => {
		expect(resolveLayoutMode({ width: 390, height: 844 })).toBe('portrait');
	});

	it('uses landscape on wide viewports', () => {
		expect(resolveLayoutMode({ width: 1200, height: 800 })).toBe('landscape');
	});

	it('uses landscape when width is at portrait max but not taller than wide', () => {
		expect(resolveLayoutMode({ width: ATELIER_PORTRAIT_MAX_WIDTH, height: 600 })).toBe(
			'landscape'
		);
	});
});

describe('layoutPos', () => {
	it('picks portrait or landscape coordinates', () => {
		const d = drawings[0]!;
		expect(layoutPos(d, 'portrait')).toEqual(d.portrait);
		expect(layoutPos(d, 'landscape')).toEqual(d.landscape);
	});
});

describe('computeAtelierCanvas', () => {
	it('returns positive dimensions for both layout modes', () => {
		const landscape = computeAtelierCanvas('landscape');
		const portrait = computeAtelierCanvas('portrait');
		expect(landscape.width).toBeGreaterThan(0);
		expect(landscape.height).toBeGreaterThan(0);
		expect(portrait.width).toBeGreaterThan(0);
		expect(portrait.height).toBeGreaterThan(0);
	});

	it('portrait canvas is at least as tall as landscape for the current catalog', () => {
		const landscape = computeAtelierCanvas('landscape');
		const portrait = computeAtelierCanvas('portrait');
		expect(portrait.height).toBeGreaterThanOrEqual(landscape.height);
	});
});

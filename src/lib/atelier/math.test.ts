import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, smoothstep } from './math';

describe('smoothstep', () => {
	it('returns 0 at the start and 1 at the end', () => {
		expect(smoothstep(0)).toBe(0);
		expect(smoothstep(1)).toBe(1);
	});

	it('eases through the midpoint', () => {
		expect(smoothstep(0.5)).toBe(0.5);
	});

	it('clamps values below 0 and above 1', () => {
		expect(smoothstep(-1)).toBe(0);
		expect(smoothstep(2)).toBe(1);
	});
});

describe('prefersReducedMotion', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns true when the media query matches', () => {
		vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
		expect(prefersReducedMotion()).toBe(true);
	});

	it('returns false when the media query does not match', () => {
		vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
		expect(prefersReducedMotion()).toBe(false);
	});
});

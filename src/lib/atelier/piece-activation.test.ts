import { describe, expect, it } from 'vitest';
import {
	shouldSuppressPieceButtonClick,
	suppressNextPieceButtonClick
} from './piece-activation';

describe('piece-activation', () => {
	it('suppresses exactly one follow-up button click', () => {
		suppressNextPieceButtonClick();
		expect(shouldSuppressPieceButtonClick()).toBe(true);
		expect(shouldSuppressPieceButtonClick()).toBe(false);
	});

	it('returns false when nothing was suppressed', () => {
		expect(shouldSuppressPieceButtonClick()).toBe(false);
	});
});

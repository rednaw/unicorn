import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	ATELIER_THEME_HTML_ATTR,
	ATELIER_THEME_STORAGE_KEY,
	applyAtelierThemeToDocument,
	isAtelierThemeId,
	readStoredAtelierTheme,
	storeAtelierTheme
} from './atelier-themes';

describe('atelier-themes', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute(ATELIER_THEME_HTML_ATTR);
	});

	afterEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute(ATELIER_THEME_HTML_ATTR);
	});

	it('accepts only known theme ids', () => {
		expect(isAtelierThemeId('salon')).toBe(true);
		expect(isAtelierThemeId('neon')).toBe(false);
	});

	it('falls back to graphite for missing or invalid storage', () => {
		expect(readStoredAtelierTheme()).toBe('graphite');
		localStorage.setItem(ATELIER_THEME_STORAGE_KEY, 'not-a-theme');
		expect(readStoredAtelierTheme()).toBe('graphite');
	});

	it('round-trips a stored theme', () => {
		storeAtelierTheme('nocturne');
		expect(readStoredAtelierTheme()).toBe('nocturne');
	});

	it('applies the theme attribute on documentElement', () => {
		applyAtelierThemeToDocument('prussian');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('prussian');
	});
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ATELIER_THEME_HTML_ATTR,
	ATELIER_THEME_STORAGE_KEY,
	applyAtelierThemeToDocument,
	storeAtelierTheme
} from './atelier-themes';
import { atelierTheme, hydrateAtelierTheme, setAtelierTheme } from './atelier-theme.svelte';

describe('atelier-theme.svelte', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute(ATELIER_THEME_HTML_ATTR);
		atelierTheme.id = 'washi';
		applyAtelierThemeToDocument('washi');
	});

	afterEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute(ATELIER_THEME_HTML_ATTR);
	});

	it('setAtelierTheme updates shared state, storage, and the document attribute', () => {
		setAtelierTheme('graphite');

		expect(atelierTheme.id).toBe('graphite');
		expect(localStorage.getItem(ATELIER_THEME_STORAGE_KEY)).toBe('graphite');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('graphite');
	});

	it('hydrateAtelierTheme re-syncs from storage after client navigation', () => {
		setAtelierTheme('washi');
		storeAtelierTheme('salon');
		atelierTheme.id = 'washi';
		document.documentElement.setAttribute(ATELIER_THEME_HTML_ATTR, 'washi');

		hydrateAtelierTheme();

		expect(atelierTheme.id).toBe('salon');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('salon');
	});

	it('hydrateAtelierTheme falls back to washi for invalid storage', () => {
		setAtelierTheme('prussian');
		localStorage.setItem(ATELIER_THEME_STORAGE_KEY, 'not-a-theme');

		hydrateAtelierTheme();

		expect(atelierTheme.id).toBe('washi');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('washi');
	});
});

describe('atelier-theme.svelte module init', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute(ATELIER_THEME_HTML_ATTR);
		vi.resetModules();
	});

	afterEach(() => {
		vi.resetModules();
	});

	it('initialises from storage when the module loads in the browser', async () => {
		storeAtelierTheme('nocturne');
		const { atelierTheme } = await import('./atelier-theme.svelte');

		expect(atelierTheme.id).toBe('nocturne');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('nocturne');
	});

	it('defaults to washi when storage is empty on load', async () => {
		const { atelierTheme } = await import('./atelier-theme.svelte');

		expect(atelierTheme.id).toBe('washi');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('washi');
	});
});

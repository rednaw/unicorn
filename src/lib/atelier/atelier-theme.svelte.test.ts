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
		atelierTheme.id = 'graphite';
		applyAtelierThemeToDocument('graphite');
	});

	afterEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute(ATELIER_THEME_HTML_ATTR);
	});

	it('setAtelierTheme updates shared state, storage, and the document attribute', () => {
		setAtelierTheme('washi');

		expect(atelierTheme.id).toBe('washi');
		expect(localStorage.getItem(ATELIER_THEME_STORAGE_KEY)).toBe('washi');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('washi');
	});

	it('hydrateAtelierTheme re-syncs from storage after client navigation', () => {
		setAtelierTheme('graphite');
		storeAtelierTheme('salon');
		atelierTheme.id = 'graphite';
		document.documentElement.setAttribute(ATELIER_THEME_HTML_ATTR, 'graphite');

		hydrateAtelierTheme();

		expect(atelierTheme.id).toBe('salon');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('salon');
	});

	it('hydrateAtelierTheme falls back to graphite for invalid storage', () => {
		setAtelierTheme('prussian');
		localStorage.setItem(ATELIER_THEME_STORAGE_KEY, 'not-a-theme');

		hydrateAtelierTheme();

		expect(atelierTheme.id).toBe('graphite');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('graphite');
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

	it('defaults to graphite when storage is empty on load', async () => {
		const { atelierTheme } = await import('./atelier-theme.svelte');

		expect(atelierTheme.id).toBe('graphite');
		expect(document.documentElement.getAttribute(ATELIER_THEME_HTML_ATTR)).toBe('graphite');
	});
});

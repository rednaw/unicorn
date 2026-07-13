export const ATELIER_THEME_STORAGE_KEY = 'atelier-room-theme';
export const ATELIER_THEME_HTML_ATTR = 'data-atelier-theme';

export const ATELIER_THEMES = [
	{ id: 'washi', label: 'Paper' },
	{ id: 'graphite', label: 'Graphite' },
	{ id: 'bibliotheek', label: 'Library' },
	{ id: 'north-light', label: 'Light' },
	{ id: 'charcoal', label: 'Charcoal' },
	{ id: 'prussian', label: 'Blue' },
	{ id: 'plaster', label: 'Plaster' },
	{ id: 'nocturne', label: 'Dark' },
	{ id: 'salon', label: 'Red' }
] as const;

export type AtelierThemeId = (typeof ATELIER_THEMES)[number]['id'];

const THEME_IDS = new Set<string>(ATELIER_THEMES.map((t) => t.id));
const THEME_ID_LIST = ATELIER_THEMES.map((t) => t.id);

export function isAtelierThemeId(value: string): value is AtelierThemeId {
	return THEME_IDS.has(value);
}

/** Apply theme to `<html>` so CSS is correct before/at first paint. */
export function applyAtelierThemeToDocument(id: AtelierThemeId): void {
	if (typeof document === 'undefined') return;
	document.documentElement.setAttribute(ATELIER_THEME_HTML_ATTR, id);
}

export function readStoredAtelierTheme(): AtelierThemeId {
	if (typeof localStorage === 'undefined') return 'graphite';
	const stored = localStorage.getItem(ATELIER_THEME_STORAGE_KEY);
	return stored && isAtelierThemeId(stored) ? stored : 'graphite';
}

export function storeAtelierTheme(id: AtelierThemeId): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(ATELIER_THEME_STORAGE_KEY, id);
}

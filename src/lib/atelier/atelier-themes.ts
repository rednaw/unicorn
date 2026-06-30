export const ATELIER_THEME_STORAGE_KEY = 'atelier-room-theme';

export const ATELIER_THEMES = [
	{ id: 'bibliotheek', label: 'Library' },
	{ id: 'north-light', label: 'North light' },
	{ id: 'charcoal', label: 'Charcoal studio' },
	{ id: 'prussian', label: 'Prussian study' },
	{ id: 'washi', label: 'Washi & hinoki' },
	{ id: 'plaster', label: 'Warm plaster' },
	{ id: 'graphite', label: 'Graphite' },
	{ id: 'nocturne', label: 'Nocturne' }
] as const;

export type AtelierThemeId = (typeof ATELIER_THEMES)[number]['id'];

const THEME_IDS = new Set<string>(ATELIER_THEMES.map((t) => t.id));

export function isAtelierThemeId(value: string): value is AtelierThemeId {
	return THEME_IDS.has(value);
}

export function readStoredAtelierTheme(): AtelierThemeId {
	if (typeof localStorage === 'undefined') return 'bibliotheek';
	const stored = localStorage.getItem(ATELIER_THEME_STORAGE_KEY);
	return stored && isAtelierThemeId(stored) ? stored : 'bibliotheek';
}

export function storeAtelierTheme(id: AtelierThemeId): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(ATELIER_THEME_STORAGE_KEY, id);
}

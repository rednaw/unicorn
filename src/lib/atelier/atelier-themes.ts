export const ATELIER_THEME_STORAGE_KEY = 'atelier-room-theme';

export const ATELIER_THEMES = [
	{ id: 'washi', label: 'Washi & hinoki' },
	{ id: 'graphite', label: 'Graphite' }
] as const;

export type AtelierThemeId = (typeof ATELIER_THEMES)[number]['id'];

const THEME_IDS = new Set<string>(ATELIER_THEMES.map((t) => t.id));

export function isAtelierThemeId(value: string): value is AtelierThemeId {
	return THEME_IDS.has(value);
}

export function readStoredAtelierTheme(): AtelierThemeId {
	if (typeof localStorage === 'undefined') return 'washi';
	const stored = localStorage.getItem(ATELIER_THEME_STORAGE_KEY);
	return stored && isAtelierThemeId(stored) ? stored : 'washi';
}

export function storeAtelierTheme(id: AtelierThemeId): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(ATELIER_THEME_STORAGE_KEY, id);
}

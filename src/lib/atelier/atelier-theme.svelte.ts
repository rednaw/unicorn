import {
	readStoredAtelierTheme,
	storeAtelierTheme,
	type AtelierThemeId
} from './atelier-themes';

/** Shared room theme — set via ThemePicker (temporary). */
export const atelierTheme = $state<{ id: AtelierThemeId }>({ id: 'washi' });

let hydrated = false;

/** Call once on atelier mount — reads localStorage after SSR. */
export function hydrateAtelierTheme(): void {
	if (hydrated) return;
	atelierTheme.id = readStoredAtelierTheme();
	hydrated = true;
}

export function setAtelierTheme(id: AtelierThemeId): void {
	atelierTheme.id = id;
	storeAtelierTheme(id);
}

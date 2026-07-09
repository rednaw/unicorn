import { browser } from '$app/environment';
import {
	applyAtelierThemeToDocument,
	readStoredAtelierTheme,
	storeAtelierTheme,
	type AtelierThemeId
} from './atelier-themes';

const initialId = browser ? readStoredAtelierTheme() : 'graphite';
if (browser) applyAtelierThemeToDocument(initialId);

/** Shared room theme — set via ThemePicker, persisted per device. */
export const atelierTheme = $state<{ id: AtelierThemeId }>({ id: initialId });

/** Re-sync from storage when the atelier page mounts (client navigations). */
export function hydrateAtelierTheme(): void {
	const id = readStoredAtelierTheme();
	atelierTheme.id = id;
	applyAtelierThemeToDocument(id);
}

export function setAtelierTheme(id: AtelierThemeId): void {
	atelierTheme.id = id;
	storeAtelierTheme(id);
	applyAtelierThemeToDocument(id);
}

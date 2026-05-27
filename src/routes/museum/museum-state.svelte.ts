import { tracks, type Track } from '$lib/content';

// Shared museum state. Lives at the layout level so navigating
// from /museum to /museum/[slug] preserves player state.
export const museum = $state({
	currentTrack: tracks[0] as Track
});

export function selectTrack(track: Track) {
	museum.currentTrack = track;
}

import { tracks, type Track } from '$lib/content';

// Shared gallery state. Lives at the site layout level so navigating
// between / and /werk/[slug] preserves player state.
export const site = $state({
	currentTrack: tracks[0] as Track
});

export function selectTrack(track: Track) {
	site.currentTrack = track;
}

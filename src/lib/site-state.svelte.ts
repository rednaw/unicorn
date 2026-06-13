import { tracks, type Track } from '$lib/content';

// Shared gallery playlist state. Lives at the site layout level so navigating
// between / and /werk/[slug] preserves player state.
export const site = $state({
	index: 0,
	playToken: 0,
	pauseToken: 0,
	isPlaying: false
});

export function playTrack(i: number) {
	site.index = i;
	site.playToken++;
}

export function next() {
	site.index = (site.index + 1) % tracks.length;
	site.playToken++;
}

export function prev() {
	site.index = (site.index - 1 + tracks.length) % tracks.length;
	site.playToken++;
}

export function selectTrack(track: Track) {
	const i = tracks.findIndex((t) => t.id === track.id);
	if (i >= 0) playTrack(i);
}

export function toggleHeroPlayback() {
	if (site.isPlaying) {
		site.pauseToken++;
	} else {
		site.playToken++;
	}
}

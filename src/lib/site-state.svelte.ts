// Backwards-compatible facade over the shared audio engine. `site` is the
// reactive engine state; the playlist controls delegate to the engine so the
// gallery and the docked player keep working with their existing imports.
export {
	engine as site,
	playTrack,
	toggleHeroPlayback,
	next,
	prev
} from './audio-engine.svelte';

// Optional drawing ↔ recording links. Drawings and tracks are independent
// lists; pairings may be added or removed as assets arrive at uneven pace.
// At most one track per drawing and one drawing per track.

import { drawings, tracks, type Drawing, type Track } from '$lib/content';

export type DrawingTrackPairing = {
	drawingId: string;
	trackId: string;
};

export const pairings: DrawingTrackPairing[] = [
	{ drawingId: 'studie-i', trackId: 'chopin-ballade-4' },
	{ drawingId: 'buste-profiel', trackId: 'chopin-mazurka-op50-2' },
	{ drawingId: 'maskers', trackId: 'chopin-polonaise' }
];

const trackIdByDrawing = new Map(pairings.map((p) => [p.drawingId, p.trackId]));
const drawingIdByTrack = new Map(pairings.map((p) => [p.trackId, p.drawingId]));

export function trackForDrawing(drawingId: string): Track | undefined {
	const id = trackIdByDrawing.get(drawingId);
	return id ? tracks.find((t) => t.id === id) : undefined;
}

export function drawingForTrack(trackId: string): Drawing | undefined {
	const id = drawingIdByTrack.get(trackId);
	return id ? drawings.find((d) => d.id === id) : undefined;
}

export function trackIndexForId(trackId: string): number | undefined {
	const i = tracks.findIndex((t) => t.id === trackId);
	return i >= 0 ? i : undefined;
}

export function trackIndexForDrawing(drawingId: string): number | undefined {
	const track = trackForDrawing(drawingId);
	return track ? trackIndexForId(track.id) : undefined;
}

export function isPairedDrawing(drawingId: string): boolean {
	return trackIdByDrawing.has(drawingId);
}

export function isPairedTrack(trackId: string): boolean {
	return drawingIdByTrack.has(trackId);
}

/** Tracks with no linked drawing (e.g. recording published before its plate). */
export function unpairedTracks(): Track[] {
	return tracks.filter((t) => !drawingIdByTrack.has(t.id));
}

/** Drawings with no linked recording (e.g. work scanned before audio is chosen). */
export function unpairedDrawings(): Drawing[] {
	return drawings.filter((d) => !trackIdByDrawing.has(d.id));
}

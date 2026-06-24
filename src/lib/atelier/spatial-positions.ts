import { drawingForTrack, type Drawing, type Track } from '$lib/content';
import { pieceBounds } from './drawing-geometry';

export function drawingSize(drawing: Drawing) {
	return pieceBounds(drawing);
}

/** Where spatial volume is measured — centre of the mat (focus / zoom target). */
export function drawingListenPoint(drawing: Drawing) {
	const { width, height } = drawingSize(drawing);
	const x = drawing.pos?.x ?? 0;
	const y = drawing.pos?.y ?? 0;
	return { x: x + width / 2, y: y + height / 2 };
}

/** Speaker badge on the mat — bottom-right, on the paired drawing. */
export function drawingSpeakerPoint(drawing: Drawing) {
	const { width, height } = drawingSize(drawing);
	const x = drawing.pos?.x ?? 0;
	const y = drawing.pos?.y ?? 0;
	return { x: x + width - 36, y: y + height - 40 };
}

export function spatialListenPoint(track: Track) {
	const drawing = drawingForTrack(track.id);
	if (drawing) return drawingListenPoint(drawing);
	if (track.pos) return track.pos;
	return null;
}

export function spatialSpeakerPoint(track: Track) {
	const drawing = drawingForTrack(track.id);
	if (drawing) return drawingSpeakerPoint(drawing);
	if (track.pos) return track.pos;
	return null;
}

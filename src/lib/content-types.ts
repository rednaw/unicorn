export type DrawingTrack = {
	id: string;
	title: string;
	composer: string;
	src: string;
};

/** Floor placement — absolute coordinates on the atelier canvas. */
export type Drawing = {
	id: string;
	title: string;
	year: string;
	medium: string;
	alt: string;
	src: string;
	thumb: string;
	srcWidth: number;
	srcHeight: number;
	rotation?: number;
	/** Portrait floor position. */
	portrait: { x: number; y: number };
	/** Landscape floor position. */
	landscape: { x: number; y: number };
	width?: number;
	track?: DrawingTrack;
};

export type DrawingWithTrack = Drawing & { track: DrawingTrack };

export type Atelier = {
	entryDrawingId: string;
	drawings: Drawing[];
};

/** Horizontal mat padding on atelier pieces (14px × 2) — sync with `DrawingPiece.svelte`. */
export const DRAWING_SLOT_PADDING_X = 28;
/** Fallback piece slot width when a drawing omits `width`. */
export const DEFAULT_DRAWING_WIDTH = 320;
/** Worst-case DPR for sharp zoom cap (phones). */
export const SHARP_DPR = 3;

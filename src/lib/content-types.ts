/** Widen to `Record<Locale, string>` when i18n returns. */
export type LocalizedText = string;

export type DrawingTrack = {
	id: string;
	title: LocalizedText;
	composer: string;
	src: string;
};

/** Authoring shape — `pos` is relative to the parent table's centre. */
export type TableDrawing = {
	id: string;
	title: LocalizedText;
	year: string;
	medium: LocalizedText;
	alt: LocalizedText;
	src: string;
	thumb: string;
	srcWidth: number;
	srcHeight: number;
	rotation?: number;
	pos: { x: number; y: number };
	width?: number;
	track?: DrawingTrack;
};

/** Flattened floor placement — `pos` is absolute on the atelier canvas. */
export type Drawing = TableDrawing;

export type DrawingWithTrack = Drawing & { track: DrawingTrack };

export type Table = {
	id: string;
	center: { x: number; y: number };
	drawings: TableDrawing[];
};

export type Atelier = {
	entryDrawingId: string;
	tables: Table[];
};

/** Horizontal mat padding on atelier pieces (14px × 2) — sync with `DrawingPiece.svelte`. */
export const DRAWING_SLOT_PADDING_X = 28;
/** Fallback piece slot width when a drawing omits `width`. */
export const DEFAULT_DRAWING_WIDTH = 320;
/** Worst-case DPR for sharp zoom cap (phones). */
export const SHARP_DPR = 3;

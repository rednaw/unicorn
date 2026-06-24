import { base } from '$app/paths';

export type Drawing = {
	id: string;
	title: string;
	year: string;
	medium: string;
	alt: string;
	/** Original JPEG — atelier lazy-load (sharp zoom) */
	src: string;
	/** Gallery + atelier placeholder — `{basename}-thumb.webp` */
	thumb: string;
	/** Pixel width of `src` JPEG (must match file in `static/drawings/`). */
	srcWidth: number;
	/** Pixel height of `src` JPEG. */
	srcHeight: number;
	rotation?: number;
	pos?: { x: number; y: number };
	width?: number;
};

/** Horizontal mat padding on atelier pieces (14px × 2) — sync with `DrawingPiece.svelte`. */
export const DRAWING_SLOT_PADDING_X = 28;
/** Worst-case DPR for sharp zoom cap (phones). */
export const SHARP_DPR = 3;

/**
 * Max zoom before the browser upscales past 1:1 device pixels on `src`.
 * `width` is the piece slot; the image spans `width - DRAWING_SLOT_PADDING_X`.
 */
export function maxSharpZoomForDrawing(d: Drawing): number {
	const inner = (d.width ?? 320) - DRAWING_SLOT_PADDING_X;
	return d.srcWidth / (inner * SHARP_DPR);
}

export function atelierMaxZoom(): number {
	return Math.min(...drawings.map(maxSharpZoomForDrawing));
}

export type Track = {
	id: string;
	title: string;
	composer: string;
	src: string;
	pos?: { x: number; y: number };
};

const asset = (path: string) => `${base}${path}`;

const drawingPaths = (_id: string, file: string) => {
	const base = file.replace(/\.[^.]+$/, '');
	return {
		src: asset(`/drawings/${file}`),
		thumb: asset(`/drawings/${base}-thumb.webp`)
	};
};

export const artist = {
	name: 'V. Solenne',
	tagline: 'tekeningen en geluid'
};

export const drawings: Drawing[] = [
	{
		id: 'studie-i',
		title: 'Studie I',
		year: '2023',
		medium: 'potlood op papier',
		alt: 'Abstracte potloodstudie met horizontale banden en een verticale vorm',
		...drawingPaths('studie-i', 'image001.jpg'),
		srcWidth: 2999,
		srcHeight: 4441,
		rotation: -2,
		pos: { x: 240, y: 200 },
		width: 280
	},
	{
		id: 'buste-profiel',
		title: 'Buste in profiel',
		year: '2023',
		medium: 'potlood op papier',
		alt: 'Potloodstudie van een klassieke buste in profiel',
		...drawingPaths('buste-profiel', 'image002.jpg'),
		srcWidth: 3100,
		srcHeight: 4471,
		rotation: 3,
		pos: { x: 880, y: 260 },
		width: 300
	},
	{
		id: 'maskers',
		title: 'Maskers',
		year: '2023',
		medium: 'potlood op papier',
		alt: 'Vier Venetiaanse maskers, getekend in potlood',
		...drawingPaths('maskers', 'image003.jpg'),
		srcWidth: 2956,
		srcHeight: 4398,
		rotation: -4,
		pos: { x: 1520, y: 180 },
		width: 280
	}
];

export const tracks: Track[] = [
	{
		id: 'chopin-ballade-4',
		title: 'Ballade nr. 4 in f klein, op. 52',
		composer: 'Frédéric Chopin',
		src: asset('/audio/chopin-ballade-opus-52-no-4.m4a'),
		pos: { x: 450, y: 580 }
	},
	{
		id: 'chopin-mazurka-op50-2',
		title: 'Mazurka in As, op. 50 nr. 2',
		composer: 'Frédéric Chopin',
		src: asset('/audio/chopin-mazurka-opus-50-no-2.m4a'),
		pos: { x: 1100, y: 620 }
	},
	{
		id: 'chopin-polonaise',
		title: 'Polonaise in As, op. 53 ("Heroïque")',
		composer: 'Frédéric Chopin',
		src: asset('/audio/chopin-polonaise.ogg'),
		pos: { x: 1720, y: 530 }
	}
];

// Optional drawing ↔ track links. Add or remove rows as assets arrive at uneven
// pace. At most one track per drawing and one drawing per track.
const pairings: { drawingId: string; trackId: string }[] = [
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

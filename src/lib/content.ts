import { base } from '$app/paths';

export type DrawingTrack = {
	id: string;
	title: string;
	composer: string;
	src: string;
};

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
	/** Optional 1:1 audio — spatial centre is the drawing mat centre. */
	track?: DrawingTrack;
};

export type DrawingWithTrack = Drawing & { track: DrawingTrack };

/** Horizontal mat padding on atelier pieces (14px × 2) — sync with `DrawingPiece.svelte`. */
export const DRAWING_SLOT_PADDING_X = 28;
/** Fallback piece slot width when a drawing omits `width`. */
export const DEFAULT_DRAWING_WIDTH = 320;
/** Worst-case DPR for sharp zoom cap (phones). */
export const SHARP_DPR = 3;

/**
 * Max zoom before the browser upscales past 1:1 device pixels on `src`.
 * `width` is the piece slot; the image spans `width - DRAWING_SLOT_PADDING_X`.
 */
export function maxSharpZoomForDrawing(d: Drawing): number {
	const inner = (d.width ?? DEFAULT_DRAWING_WIDTH) - DRAWING_SLOT_PADDING_X;
	return d.srcWidth / (inner * SHARP_DPR);
}

export function atelierMaxZoom(): number {
	return Math.min(...drawings.map(maxSharpZoomForDrawing));
}

const asset = (path: string) => `${base}${path}`;

const drawingPaths = (_id: string, file: string) => {
	const baseName = file.replace(/\.[^.]+$/, '');
	return {
		src: asset(`/drawings/${file}`),
		thumb: asset(`/drawings/${baseName}-thumb.webp`)
	};
};

export const artist = {
	name: 'V. Solenne',
	tagline: 'tekeningen en muziek'
};

/** Atelier layout: scattered triangle on desk — positions for tablet/desktop. */
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
		pos: { x: 1180, y: 1030 },
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
		pos: { x: 798, y: 248 },
		width: 300,
		track: {
			id: 'chopin-mazurka-op50-2',
			title: 'Mazurka in As, op. 50 nr. 2',
			composer: 'Frédéric Chopin',
			src: asset('/audio/chopin-mazurka-opus-50-no-2.m4a')
		}
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
		pos: { x: 400, y: 62 },
		width: 280,
		track: {
			id: 'chopin-ballade-4',
			title: 'Ballade nr. 4 in f klein, op. 52',
			composer: 'Frédéric Chopin',
			src: asset('/audio/chopin-ballade-opus-52-no-4.m4a')
		}
	},
	{
		id: 'lachend-portret',
		title: 'Lachend portret',
		year: '2023',
		medium: 'potlood op papier',
		alt: 'Portret van een lachende man met opgerolde mouwen',
		...drawingPaths('lachend-portret', 'image004.jpg'),
		srcWidth: 3057,
		srcHeight: 4441,
		rotation: 2,
		pos: { x: 1200, y: 560 },
		width: 290
	},
	{
		id: 'profielstudie',
		title: 'Profielstudie',
		year: '2023',
		medium: 'potlood op papier',
		alt: 'Gestileerd gezicht in profiel met zware schaduwen',
		...drawingPaths('profielstudie', 'image005.jpg'),
		srcWidth: 2885,
		srcHeight: 4413,
		rotation: -3,
		pos: { x: 450, y: 780 },
		width: 280
	},
	{
		id: 'portret-strik',
		title: 'Portret met strik',
		year: '2023',
		medium: 'potlood op papier',
		alt: 'Portret in driekwartprofiel met strik en jas',
		...drawingPaths('portret-strik', 'image006.jpg'),
		srcWidth: 3057,
		srcHeight: 4398,
		rotation: 4,
		pos: { x: 1280, y: 90 },
		width: 300
	}
];

/** Drawings that carry audio — index matches the spatial audio graph. */
export const audioDrawings = drawings.filter((d): d is DrawingWithTrack => !!d.track);

/** Flat track list (credits, etc.). */
export const tracks = audioDrawings.map((d) => d.track);

export function audioIndexForDrawing(drawingId: string): number {
	return audioDrawings.findIndex((d) => d.id === drawingId);
}

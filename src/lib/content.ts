import { asset } from '$app/paths';
import {
	atelierMaxZoom as deriveAtelierMaxZoom,
	audioDrawingsFrom,
	audioIndexForDrawing as deriveAudioIndex
} from './content-derive';
import type { Drawing } from './content-types';
export type { Atelier, Drawing, DrawingTrack, DrawingWithTrack } from './content-types';
export {
	DEFAULT_DRAWING_WIDTH,
	DRAWING_SLOT_PADDING_X,
	SHARP_DPR
} from './content-types';
export { maxSharpZoomForDrawing } from './content-derive';

const drawingPaths = (_id: string, file: string) => {
	const baseName = file.replace(/\.[^.]+$/, '');
	return {
		src: asset(`/drawings/${file}`),
		thumb: asset(`/drawings/${baseName}-thumb.webp`)
	};
};

export const artist = {
	name: 'RvA',
	tagline: 'tekeningen en muziek'
};

/** Site content — absolute floor coordinates per breakpoint. */
export const atelier = {
	entryDrawingId: 'maskers',
	drawings: [
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
			portrait: { x: 405, y: 22 },
			landscape: { x: 120, y: 62 },
			width: 280,
			track: {
				id: 'chopin-ballade-4',
				title: 'Ballade nr. 4 in f klein, op. 52',
				composer: 'Frédéric Chopin',
				src: asset('/audio/chopin-ballade-opus-52-no-4.m4a')
			}
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
			portrait: { x: 62, y: 420 },
			landscape: { x: 598, y: 248 },
			width: 300
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
			portrait: { x: 780, y: 370 },
			landscape: { x: 250, y: 780 },
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
			portrait: { x: 58, y: 1450 },
			landscape: { x: 1280, y: 90 },
			width: 300
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
			portrait: { x: 398, y: 900 },
			landscape: { x: 1200, y: 660 },
			width: 290,
			track: {
				id: 'chopin-mazurka-op50-2',
				title: 'Mazurka in As, op. 50 nr. 2',
				composer: 'Frédéric Chopin',
				src: asset('/audio/chopin-mazurka-opus-50-no-2.m4a')
			}
		},
		{
			id: 'studie-i',
			title: 'Studie I',
			year: '2023',
			medium: 'potlood op papier',
			alt: 'Abstracte potloodstudie met horizontale banden en een verticale vorm',
			...drawingPaths('studie-i', 'image001.jpg'),
			srcWidth: 2999,
			srcHeight: 4441,
			rotation: 8,
			portrait: { x: 775, y: 1375 },
			landscape: { x: 740, y: 830 },
			width: 280
		}
	]
} satisfies import('./content-types').Atelier;

export const entryDrawingId = atelier.entryDrawingId;

export const drawings: Drawing[] = atelier.drawings;

/** Drawings that carry audio — index matches the spatial audio graph. */
export const audioDrawings = audioDrawingsFrom(drawings);

/** Flat track list (credits, etc.). */
export const tracks = audioDrawings.map((d) => d.track);

export function audioIndexForDrawing(drawingId: string): number {
	return deriveAudioIndex(drawings, drawingId);
}

export function atelierMaxZoom(): number {
	return deriveAtelierMaxZoom(drawings);
}

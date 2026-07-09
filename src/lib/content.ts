import { asset } from '$app/paths';
import { audioDrawingsFrom, audioIndexMapFrom } from './content-derive';
import type { Drawing } from './content-types';
export type { Atelier, Drawing, DrawingTrack, DrawingWithTrack } from './content-types';
export { DEFAULT_DRAWING_WIDTH, DRAWING_SLOT_PADDING_X } from './content-types';

const drawingPaths = (file: string) => {
	const baseName = file.replace(/\.[^.]+$/, '');
	return {
		src: asset(`/drawings/${file}`),
		thumb: asset(`/drawings/${baseName}-thumb.webp`)
	};
};

const atelier = {
	entryDrawingId: 'maskers',
	drawings: [
		{
			id: 'maskers',
			title: 'Maskers',
			year: '2023',
			medium: 'potlood op papier',
			alt: 'Vier Venetiaanse maskers, getekend in potlood',
			...drawingPaths('image003.jpg'),
			srcWidth: 2956,
			srcHeight: 4398,
			rotation: -4,
			portrait: { x: 405, y: 22 },
			landscape: { x: 120, y: 62 },
			width: 300,
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
			...drawingPaths('image002.jpg'),
			srcWidth: 3100,
			srcHeight: 4471,
			rotation: 3,
			portrait: { x: 62, y: 420 },
			landscape: { x: 598, y: 248 },
			width: 300,
			track: {
				id: 'beethoven-rondo-op51-1',
				title: 'Rondo in C majeur, op. 51 nr. 1',
				composer: 'Ludwig von Beethoven',
				src: asset('/audio/beethoven-rondo-in-c-majeur-opus-51-no-1.m4a')
			}
		},
		{
			id: 'profielstudie',
			title: 'Profielstudie',
			year: '2023',
			medium: 'potlood op papier',
			alt: 'Gestileerd gezicht in profiel met zware schaduwen',
			...drawingPaths('image005.jpg'),
			srcWidth: 2885,
			srcHeight: 4413,
			rotation: -3,
			portrait: { x: 780, y: 370 },
			landscape: { x: 250, y: 780 },
			width: 300
		},
		{
			id: 'portret-strik',
			title: 'Portret met strik',
			year: '2023',
			medium: 'potlood op papier',
			alt: 'Portret in driekwartprofiel met strik en jas',
			...drawingPaths('image006.jpg'),
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
			...drawingPaths('image004.jpg'),
			srcWidth: 3057,
			srcHeight: 4441,
			rotation: 2,
			portrait: { x: 398, y: 900 },
			landscape: { x: 1200, y: 660 },
			width: 300,
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
			...drawingPaths('image001.jpg'),
			srcWidth: 2999,
			srcHeight: 4441,
			rotation: 8,
			portrait: { x: 775, y: 1275 },
			landscape: { x: 740, y: 830 },
			width: 300
		},
		// {
		// 	id: 'stilleven',
		// 	title: 'Stilleven',
		// 	year: '2023',
		// 	medium: 'potlood op papier',
		// 	alt: 'Stilleven met plant in glas, cilinder en kom op schotel',
		// 	...drawingPaths('image007.jpg'),
		// 	srcWidth: 2986,
		// 	srcHeight: 4341,
		// 	rotation: -2,
		// 	portrait: { x: 55, y: 2280 },
		// 	landscape: { x: 40, y: 1280 },
		// 	width: 300
		// },
		// {
		// 	id: 'buste-driekwart',
		// 	title: 'Buste driekwart',
		// 	year: '2023',
		// 	medium: 'potlood op papier',
		// 	alt: 'Potloodstudie van een klassieke buste in driekwartprofiel',
		// 	...drawingPaths('image008.jpg'),
		// 	srcWidth: 2971,
		// 	srcHeight: 4297,
		// 	rotation: -5,
		// 	portrait: { x: 780, y: 2150 },
		// 	landscape: { x: 600, y: 1280 },
		// 	width: 300
		// },
		// {
		// 	id: 'portret-lang-haar',
		// 	title: 'Portret met lang haar',
		// 	year: '2023',
		// 	medium: 'potlood op papier',
		// 	alt: 'Frontaal portret met lang haar en zachte schaduwen',
		// 	...drawingPaths('image009.jpg'),
		// 	srcWidth: 2971,
		// 	srcHeight: 4413,
		// 	rotation: 3,
		// 	portrait: { x: 420, y: 1760 },
		// 	landscape: { x: 1320, y: 1280 },
		// 	width: 300
		// }
	]
} satisfies import('./content-types').Atelier;

export const artist = {
	name: 'RvA',
	tagline: 'tekeningen en muziek'
};

export const entryDrawingId = atelier.entryDrawingId;

export const drawings: Drawing[] = atelier.drawings;

/** Drawings that carry audio — paired with `audio-player` track list. */
export const audioDrawings = audioDrawingsFrom(drawings);

const audioIndexByDrawingId = audioIndexMapFrom(drawings);

export function audioIndexForDrawing(drawingId: string): number {
	return audioIndexByDrawingId.get(drawingId) ?? -1;
}

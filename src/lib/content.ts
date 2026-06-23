// Single source of truth for the site's content.
// User-facing strings are in Dutch (the site language); code and types stay English.

import { base } from '$app/paths';

export type Drawing = {
	id: string;
	title: string;
	year: string;
	medium: string;
	src: string;
	alt: string;
	/** Rotation in degrees — used on the atelier canvas */
	rotation?: number;
	/** Position on the atelier canvas */
	pos?: { x: number; y: number };
	/** Render width on the atelier canvas (px) */
	width?: number;
};

export type Track = {
	id: string;
	title: string;
	composer: string;
	src: string;
	/** Position of the speaker on the atelier canvas */
	pos?: { x: number; y: number };
};

/** Resolve a /static path to one that respects the BASE_PATH GitHub Pages prefix. */
const asset = (path: string) => `${base}${path}`;

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
		src: asset('/drawings/image001.jpg'),
		alt: 'Abstracte potloodstudie met horizontale banden en een verticale vorm',
		rotation: -2,
		pos: { x: 240, y: 200 },
		width: 280
	},
	{
		id: 'buste-profiel',
		title: 'Buste in profiel',
		year: '2023',
		medium: 'potlood op papier',
		src: asset('/drawings/image002.jpg'),
		alt: 'Potloodstudie van een klassieke buste in profiel',
		rotation: 3,
		pos: { x: 880, y: 260 },
		width: 300
	},
	{
		id: 'maskers',
		title: 'Maskers',
		year: '2023',
		medium: 'potlood op papier',
		src: asset('/drawings/image003.jpg'),
		alt: 'Vier Venetiaanse maskers, getekend in potlood',
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

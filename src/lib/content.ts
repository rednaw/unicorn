import { base } from '$app/paths';

export type Drawing = {
	id: string;
	title: string;
	year: string;
	medium: string;
	src: string;
	alt: string;
	rotation?: number;
	pos?: { x: number; y: number };
	width?: number;
};

export type Track = {
	id: string;
	title: string;
	composer: string;
	src: string;
	pos?: { x: number; y: number };
};

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

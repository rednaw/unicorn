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
		id: 'figure-study',
		title: 'Figuurstudie, naar Dürer',
		year: '1508',
		medium: 'potlood op getint papier',
		src: asset('/drawings/praying-hands.svg'),
		alt: 'Gedetailleerde potloodstudie van twee gevouwen handen',
		rotation: -3,
		pos: { x: 200, y: 180 },
		width: 320
	},
	{
		id: 'anatomy-foetus',
		title: 'Anatomische studie, naar da Vinci',
		year: '1511',
		medium: 'pen, inkt en wassing',
		src: asset('/drawings/foetus-study.svg'),
		alt: 'Anatomische tekening van een foetus in de baarmoeder',
		rotation: 5,
		pos: { x: 720, y: 120 },
		width: 380
	},
	{
		id: 'concert',
		title: 'Op het concert',
		year: '1887',
		medium: 'conté-krijt',
		src: asset('/drawings/seurat-concert.svg'),
		alt: 'Conté-krijttekening van toeschouwers in een concertzaal',
		rotation: -1,
		pos: { x: 1240, y: 260 },
		width: 360
	},
	{
		id: 'hare',
		title: 'Haas in een veld',
		year: '1502',
		medium: 'aquarel en gouache op papier',
		src: asset('/drawings/young-hare.svg'),
		alt: 'Een nauwkeurig geobserveerde haas in profiel',
		rotation: 2,
		pos: { x: 420, y: 640 },
		width: 320
	},
	{
		id: 'horse',
		title: 'Paardenstudie',
		year: '1490',
		medium: 'zilverstift op geprepareerd papier',
		src: asset('/drawings/horse-study.svg'),
		alt: 'Een studie van een steigerend paard',
		rotation: -4,
		pos: { x: 940, y: 700 },
		width: 340
	},
	{
		id: 'self-portrait',
		title: 'Zelfportret',
		year: '1934',
		medium: 'litho',
		src: asset('/drawings/kollwitz-self.svg'),
		alt: 'Een lithografisch zelfportret van een oudere vrouw met gebogen hoofd',
		rotation: 3,
		pos: { x: 1480, y: 760 },
		width: 300
	}
];

export const tracks: Track[] = [
	{
		id: 'rachmaninov-prelude',
		title: 'Prelude in cis klein, op. 3 nr. 2',
		composer: 'Sergej Rachmaninov',
		src: asset('/audio/rachmaninov-prelude.ogg'),
		pos: { x: 320, y: 980 }
	},
	{
		id: 'liszt-liebestraum',
		title: 'Liebestraum nr. 3',
		composer: 'Franz Liszt',
		src: asset('/audio/liszt-liebestraum.ogg'),
		pos: { x: 1020, y: 980 }
	},
	{
		id: 'chopin-polonaise',
		title: 'Polonaise in As, op. 53 ("Heroïque")',
		composer: 'Frédéric Chopin',
		src: asset('/audio/chopin-polonaise.ogg'),
		pos: { x: 1620, y: 980 }
	}
];

// Single source of truth for the prototype's content.
// All four variants (/verhaal, /museum, /tijdschrift, /atelier) import from here.
// User-facing strings are in Dutch (the site language); code and types stay English.

import { base } from '$app/paths';

export type Drawing = {
	id: string;
	title: string;
	year: string;
	medium: string;
	src: string;
	alt: string;
	/** Atelier-only: rotation in degrees */
	rotation?: number;
	/** Atelier-only: absolute position on the infinite canvas */
	pos?: { x: number; y: number };
	/** Atelier-only: render width in canvas px */
	width?: number;
};

export type Track = {
	id: string;
	title: string;
	composer: string;
	src: string;
	/** Atelier-only: position of the "speaker" on the canvas */
	pos?: { x: number; y: number };
};

export type Poem = {
	id: string;
	title: string;
	author: string;
	lines: string[];
	/** Drawing id this poem is conceptually paired with (tijdschrift/verhaal variants) */
	pairsWith?: string;
	/** Atelier-only: position of the torn-paper card */
	pos?: { x: number; y: number };
	rotation?: number;
};

/** Resolve a /static path to one that respects the BASE_PATH GitHub Pages prefix. */
const asset = (path: string) => `${base}${path}`;

export const artist = {
	name: 'V. Solenne',
	tagline: 'potloodtekeningen, pianoschetsen, fragmenten van poëzie',
	bio: `Een fictieve kunstenaar die werkt in grafiet, geluid en vers. De tekeningen
hier zijn studies uit het publieke domein; de muziek bestaat uit fragmenten van
pianowerken uit het publieke domein; de gedichten zijn Nederlandstalige verzen
uit het publieke domein. Samen staan ze in voor een echt oeuvre — het prototype
laat zien hoe vier verschillende ontwerptalen dat werk kunnen presenteren.`
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

export const poems: Poem[] = [
	{
		id: 'mei',
		title: 'Mei (opening)',
		author: 'Herman Gorter',
		lines: [
			'Een nieuwe lente en een nieuw geluid:',
			'ik wil dat dit lied klinkt als het gefluit,',
			'dat ik vaak hoorde voor een zomernacht',
			'in een oud stadje, langs de watergracht —'
		],
		pairsWith: 'figure-study',
		pos: { x: 480, y: 240 },
		rotation: 5
	},
	{
		id: 'schrijverke',
		title: 'Het schrijverke',
		author: 'Guido Gezelle',
		lines: [
			'O Krinklende winklende waterding',
			"met 't zwarte kapoteken aan,",
			'wat zien ik toch geren uw kopke flink',
			"al schrijven op 't watervlak gaan!"
		],
		pairsWith: 'hare',
		pos: { x: 820, y: 520 },
		rotation: 4
	},
	{
		id: 'holland',
		title: 'Herinnering aan Holland',
		author: 'Hendrik Marsman',
		lines: [
			'Denkend aan Holland',
			'zie ik breede rivieren',
			'traag door oneindig',
			'laagland gaan,',
			'rijen ondenkbaar',
			'ijle populieren',
			'als hooge pluimen',
			'aan den einder staan;'
		],
		pairsWith: 'horse',
		pos: { x: 1360, y: 540 },
		rotation: -2
	},
	{
		id: 'woonhuis',
		title: 'Om mijn oud woonhuis',
		author: 'J. H. Leopold',
		lines: [
			'Om mijn oud woonhuis peppels staan,',
			"'mijn lief, mijn lief, o waar gebleven',",
			'een smalle laan',
			'van natte blaren, het vallen komt.'
		],
		pairsWith: 'concert',
		pos: { x: 1100, y: 340 },
		rotation: 3
	},
	{
		id: 'zachte-krachten',
		title: 'De zachte krachten',
		author: 'Henriette Roland Holst',
		lines: [
			'De zachte krachten zullen zeker winnen',
			"in 't eind — dit hoor ik als een innig fluistren",
			'in mij: zoo \u2019t zweeg zou alle licht verduistren',
			'alle warmte zou verstarren van binnen.'
		],
		pairsWith: 'self-portrait',
		pos: { x: 260, y: 460 },
		rotation: -6
	}
];

/** Variants metadata for the landing page. */
export const variants = [
	{
		slug: 'verhaal',
		title: 'Verhaal',
		tagline: 'Scrollend vertellen',
		rationale: 'Een lineaire, filmische onthulling — scrollen is de enige interface.'
	},
	{
		slug: 'museum',
		title: 'Museum',
		tagline: 'Stille witte-muren-galerij',
		rationale: 'Royale witruimte, schreefletter, één werk tegelijk.'
	},
	{
		slug: 'tijdschrift',
		title: 'Tijdschrift',
		tagline: 'Gedrukte kunsttijdschrift-lay-out',
		rationale: "Gecomponeerde tijdschriftpagina's, initialen, kaderteksten."
	},
	{
		slug: 'atelier',
		title: 'Atelier',
		tagline: 'Een oneindige werktafel',
		rationale: 'Pannen en zoomen over verspreide werken — geluid stijgt naarmate je nadert.'
	}
] as const;

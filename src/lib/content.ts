// Single source of truth for the prototype's content.
// All five variants (/museum, /verhaal, /tijdschrift, /atelier, /dagboek) import from here.
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

/**
 * A single dagboek (diary) entry. Images and music carry the entry; the poetry
 * snippet, when present, is a single pasted-in fragment of one or two lines.
 */
export type DiaryEntry = {
	id: string;
	/** Display date in the upper-right stamp, e.g. "12 maart". */
	dateLabel: string;
	/** ISO-ish key used only for sort order — never displayed. */
	sortKey: string;
	/** Empty body marks a "niets" / blank day; render only the date stamp. */
	body?: string;
	/** Optional caption written under the (first) attached drawing. */
	drawingCaption?: string;
	/** Drawings to tape into the entry, in order. */
	drawingIds?: string[];
	/** A piece "today on the gramophone" — rendered as a luister-pill. */
	trackId?: string;
	/** A pasted-in poem fragment — kept deliberately short (1–2 lines). */
	poemFragment?: { lines: string[]; author?: string };
	/** Slight rotation applied to the entire entry card (deg). */
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
laat zien hoe vijf verschillende ontwerptalen dat werk kunnen presenteren.`
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

/**
 * Dagboek entries. Reverse-chronological by sortKey at render time.
 * Tone: fragmentary, intimate, period-flavoured but year-agnostic. The drawing
 * and the music are the centre of each entry; the poetry — when it appears at
 * all — is a single short pasted-in scrap, never a full poem.
 */
export const entries: DiaryEntry[] = [
	{
		id: 'mar-14',
		dateLabel: '14 maart',
		sortKey: '03-14',
		body: 'Weer niets afgemaakt vandaag. De spiegel is een vreemde geworden — ik teken hetzelfde gezicht steeds opnieuw, en steeds is het van iemand anders.',
		drawingIds: ['self-portrait'],
		drawingCaption: 'naar het raam toe, half licht',
		rotation: -0.6
	},
	{
		id: 'mar-12',
		dateLabel: '12 maart',
		sortKey: '03-12',
		body: `Vanochtend de figuur naar Dürer hervat. De plooien in de kleding willen niet komen — ze blijven hangen waar ik ze niet wil. Maar de schouder zit goed, eindelijk.

De Prelude op de plaat gezet, op zachtere stand. Drie maal achter elkaar, terwijl de hand bewoog. Wonderlijk hoe het potlood luistert wanneer de kamer wordt geluisterd.`,
		drawingIds: ['figure-study'],
		drawingCaption: 'drie uur, zes potlood',
		trackId: 'rachmaninov-prelude',
		poemFragment: { lines: ['Een nieuwe lente en een nieuw geluid'], author: 'Gorter' },
		rotation: 0.8
	},
	{
		id: 'mar-11',
		dateLabel: '11 maart',
		sortKey: '03-11'
	},
	{
		id: 'mar-09',
		dateLabel: '9 maart',
		sortKey: '03-09',
		body: 'De anatomie. Ik begrijp niet hoe da Vinci dit kon, met al die warmte. Ik werk in kou en zie alles helder, te helder. Een merel klopte vroeg in de morgen tegen het raam — een teken, of niets.',
		drawingIds: ['anatomy-foetus'],
		drawingCaption: 'pen en wassing, op te dun papier',
		rotation: -1.1
	},
	{
		id: 'mar-07',
		dateLabel: '7 maart',
		sortKey: '03-07',
		body: `Vandaag aan het concert begonnen. Het is meer een herinnering aan een zaal dan een tekening: licht dat door iemands hoed valt, schouders die wachten op een toon.

De Liebestraum erbij — maar half. Het stuk maakt me melancholiek voor iets dat ik niet bezit.`,
		drawingIds: ['concert'],
		drawingCaption: 'krijt, drie kwartier',
		trackId: 'liszt-liebestraum',
		rotation: 0.4
	},
	{
		id: 'mar-05',
		dateLabel: '5 maart',
		sortKey: '03-05',
		body: 'Te koud om de hand stil te houden.'
	},
	{
		id: 'mar-03',
		dateLabel: '3 maart',
		sortKey: '03-03',
		body: `Vroeg buiten geweest. Op het pad ten oosten van de molen zat een haas, doodstil. Ik had geen papier bij me, alleen het oog.

Thuis later het beeld weergegeven, met aquarel deze keer. De pels is fout maar de oren staan.`,
		drawingIds: ['hare'],
		drawingCaption: 'uit het hoofd',
		poemFragment: { lines: ['wat zien ik toch geren uw kopke flink'], author: 'Gezelle' },
		rotation: -0.5
	},
	{
		id: 'mar-01',
		dateLabel: '1 maart',
		sortKey: '03-01',
		body: `Het paard van een buurman, vanmiddag in de stal. Slechts zilverstift, slechts twintig minuten, want hij werd onrustig.

Chopin daarna, een Polonaise. Veel te grootsch voor wat ik gedaan had. Maar het paard verdiende muziek.`,
		drawingIds: ['horse'],
		drawingCaption: 'zilverstift, twintig minuten',
		trackId: 'chopin-polonaise',
		rotation: 0.7
	},
	{
		id: 'feb-28',
		dateLabel: '28 februari',
		sortKey: '02-28'
	},
	{
		id: 'feb-25',
		dateLabel: '25 februari',
		sortKey: '02-25',
		body: 'Een nieuw schrift. De kaft is bruin, het papier dun. Ik beloof mezelf niets.',
		rotation: -0.3
	}
];

/** Variants metadata for the landing page. */
export const variants = [
	{
		slug: 'museum',
		title: 'Museum',
		tagline: 'Stille witte-muren-galerij',
		rationale: 'Royale witruimte, schreefletter, één werk tegelijk.'
	},
	{
		slug: 'verhaal',
		title: 'Verhaal',
		tagline: 'Scrollend vertellen',
		rationale: 'Een lineaire, filmische onthulling — scrollen is de enige interface.'
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
	},
	{
		slug: 'dagboek',
		title: 'Dagboek',
		tagline: 'Aantekeningen rond elk werk',
		rationale: 'Polaroids, korte handgeschreven notities en muziek uit de kamer — het werk als residu van het werken.'
	}
] as const;

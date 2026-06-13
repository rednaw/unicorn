import { drawings } from '$lib/content';
import { error } from '@sveltejs/kit';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => drawings.map((d) => ({ slug: d.id }));

export const load: PageLoad = ({ params }) => {
	const drawing = drawings.find((d) => d.id === params.slug);
	if (!drawing) error(404, 'Onbekend werk');
	return { drawing };
};

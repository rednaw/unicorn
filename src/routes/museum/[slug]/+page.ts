import { base } from '$app/paths';
import { drawings } from '$lib/content';
import { redirect } from '@sveltejs/kit';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => drawings.map((d) => ({ slug: d.id }));

export const load: PageLoad = ({ params }) => {
	redirect(308, `${base}/atelier/?focus=${params.slug}`);
};

import { drawings } from '$lib/content';
import { prefetchIntentsForView } from '$lib/atelier/visible-drawings';
import { ATELIER_PREFETCH } from '$lib/atelier/constants';
import type { AtelierLayoutMode } from '$lib/atelier/atelier-layout';
import type { ViewTransform, ViewportRect } from '$lib/atelier/view-math';
import type { Drawing } from '$lib/content';

export type PrefetchIntent = 'thumb' | 'full' | 'entry' | 'sharp';

let fullReady = $state(new Set<string>());
const inflight = new Map<string, Promise<void>>();

const fullQueue: { id: string; src: string }[] = [];
let fullActive = 0;

function drawingById(id: string) {
	return drawings.find((d) => d.id === id);
}

function warmThumb(url: string): void {
	if (typeof window === 'undefined') return;
	const img = new Image();
	img.fetchPriority = 'high';
	img.src = url;
}

async function decodeFullImage(src: string): Promise<void> {
	const img = new Image();
	img.fetchPriority = 'high';
	img.src = src;
	try {
		await img.decode();
	} catch {
		await new Promise<void>((resolve) => {
			img.onload = () => resolve();
			img.onerror = () => resolve();
		});
	}
}

function drainFullQueue() {
	while (fullActive < ATELIER_PREFETCH.fullMaxConcurrent && fullQueue.length > 0) {
		const job = fullQueue.shift()!;
		fullActive++;
		const promise = decodeFullImage(job.src)
			.then(() => {
				fullReady = new Set([...fullReady, job.id]);
			})
			.finally(() => {
				fullActive--;
				inflight.delete(job.id);
				drainFullQueue();
			});
		inflight.set(job.id, promise);
	}
}

function enqueueFull(id: string, src: string): void {
	if (fullReady.has(id) || inflight.has(id)) return;
	if (fullQueue.some((j) => j.id === id)) return;
	fullQueue.push({ id, src });
	drainFullQueue();
}

/** Single entry point for warming drawing assets — callers pass id + intent, not URLs. */
export function requestDrawing(id: string, intent: PrefetchIntent): void {
	const drawing = drawingById(id);
	if (!drawing) return;

	switch (intent) {
		case 'entry':
		case 'thumb':
			warmThumb(drawing.thumb);
			return;
		case 'full':
		case 'sharp':
			enqueueFull(id, drawing.src);
			return;
	}
}

/** Reactive snapshot for templates — read inside `$derived`. */
export function fullReadyIds(): Set<string> {
	return fullReady;
}

export function prefetchVisibleInView(
	view: ViewTransform,
	viewport: ViewportRect,
	layoutMode: AtelierLayoutMode,
	posFor: (d: Drawing) => { x: number; y: number }
): void {
	for (const { id, intent } of prefetchIntentsForView(view, viewport, layoutMode, posFor)) {
		requestDrawing(id, intent);
	}
}

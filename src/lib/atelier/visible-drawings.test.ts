import { describe, expect, it } from 'vitest';
import { drawings } from '$lib/content';
import { ATELIER_PREFETCH } from './constants';
import { drawingListenPoint } from './drawing-geometry';
import { layoutPos } from './atelier-layout';
import {
	isDrawingVisibleInView,
	prefetchIntentsForView,
	visibleDrawings
} from './visible-drawings';
import { centreOnCanvas } from './view-math';

const viewport = { width: 390, height: 844 };

describe('visibleDrawings', () => {
	it('returns an empty list when the viewport has zero width', () => {
		const hits = visibleDrawings({ tx: 0, ty: 0, zoom: 1 }, { width: 0, height: 800 }, 'landscape');
		expect(hits).toEqual([]);
	});

	it('lists drawings intersecting the viewport, nearest first', () => {
		const view = { tx: 0, ty: 0, zoom: 0.2 };
		const hits = visibleDrawings(view, viewport, 'landscape');
		expect(hits.length).toBeGreaterThan(0);
		const distances = hits.map((h) => h.distance);
		expect([...distances].sort((a, b) => a - b)).toEqual(distances);
	});
});

describe('prefetchIntentsForView', () => {
	it('queues full-res only above the coverage threshold', () => {
		const overview = { tx: 0, ty: 0, zoom: 0.15 };
		const overviewIntents = prefetchIntentsForView(
			overview,
			viewport,
			'landscape',
			(d) => layoutPos(d, 'landscape')
		);
		expect(overviewIntents.length).toBeLessThan(drawings.length);

		const maskers = drawings.find((d) => d.id === 'maskers')!;
		const focus = centreOnCanvas(
			viewport,
			drawingListenPoint(maskers, maskers.landscape).x,
			drawingListenPoint(maskers, maskers.landscape).y,
			2.5
		);
		const focusedIntents = prefetchIntentsForView(
			focus,
			viewport,
			'landscape',
			(d) => layoutPos(d, 'landscape')
		);
		const maskersIntent = focusedIntents.find((i) => i.id === 'maskers');
		expect(maskersIntent).toEqual({ id: 'maskers', intent: 'full' });
		const maskersHit = visibleDrawings(focus, viewport, 'landscape').find(
			(h) => h.drawing.id === 'maskers'
		);
		expect(maskersHit?.coverage ?? 0).toBeGreaterThanOrEqual(ATELIER_PREFETCH.fullResCoverage);
	});
});

describe('isDrawingVisibleInView', () => {
	it('detects when a drawing intersects the viewport', () => {
		const maskers = drawings.find((d) => d.id === 'maskers')!;
		const focus = centreOnCanvas(
			viewport,
			drawingListenPoint(maskers, maskers.landscape).x,
			drawingListenPoint(maskers, maskers.landscape).y,
			2
		);
		expect(
			isDrawingVisibleInView('maskers', focus, viewport, 'landscape', (d) =>
				layoutPos(d, 'landscape')
			)
		).toBe(true);
	});

	it('returns false for unknown ids', () => {
		expect(
			isDrawingVisibleInView('missing', { tx: 0, ty: 0, zoom: 1 }, viewport, 'landscape', (d) =>
				layoutPos(d, 'landscape')
			)
		).toBe(false);
	});
});

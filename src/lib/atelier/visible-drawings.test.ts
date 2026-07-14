import { describe, expect, it } from 'vitest';
import { drawings } from '$lib/content';
import { mockDrawing } from '../../test/fixtures';
import { ATELIER_PREFETCH } from './constants';
import { drawingAtCanvasPoint, drawingListenPoint } from './drawing-geometry';
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
		const hits = visibleDrawings(
			drawings,
			{ tx: 0, ty: 0, zoom: 1 },
			{ width: 0, height: 800 },
			'landscape'
		);
		expect(hits).toEqual([]);
	});

	it('lists drawings intersecting the viewport, nearest first', () => {
		const view = { tx: 0, ty: 0, zoom: 0.2 };
		const hits = visibleDrawings(drawings, view, viewport, 'landscape');
		expect(hits.length).toBeGreaterThan(0);
		const distances = hits.map((h) => h.distance);
		expect([...distances].sort((a, b) => a - b)).toEqual(distances);
	});
});

describe('prefetchIntentsForView', () => {
	it('queues full-res only above the coverage threshold', () => {
		const overview = { tx: 0, ty: 0, zoom: 0.15 };
		const overviewIntents = prefetchIntentsForView(
			drawings,
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
			drawings,
			focus,
			viewport,
			'landscape',
			(d) => layoutPos(d, 'landscape')
		);
		const maskersIntent = focusedIntents.find((i) => i.id === 'maskers');
		expect(maskersIntent).toEqual({ id: 'maskers', intent: 'full' });
		const maskersHit = visibleDrawings(drawings, focus, viewport, 'landscape').find(
			(h) => h.drawing.id === 'maskers'
		);
		expect(maskersHit?.coverage ?? 0).toBeGreaterThanOrEqual(ATELIER_PREFETCH.fullResCoverage);
	});
});

describe('catalog scoping', () => {
	it('only hit-tests drawings passed in the catalog', () => {
		const back = mockDrawing({ id: 'back', landscape: { x: 0, y: 0 }, width: 200, rotation: 0 });
		const front = mockDrawing({ id: 'front', landscape: { x: 900, y: 900 }, width: 200, rotation: 0 });
		const centre = drawingListenPoint(front, front.landscape);

		expect(drawingAtCanvasPoint([front], centre.x, centre.y)).toBe('front');
		expect(drawingAtCanvasPoint([back], centre.x, centre.y)).toBeNull();
	});

	it('only reports visibility for drawings in the passed catalog', () => {
		const visible = mockDrawing({
			id: 'visible',
			landscape: { x: 100, y: 100 },
			width: 400,
			rotation: 0
		});
		const offscreen = mockDrawing({
			id: 'offscreen',
			landscape: { x: 5000, y: 5000 },
			width: 400,
			rotation: 0
		});
		const view = centreOnCanvas(
			viewport,
			drawingListenPoint(visible, visible.landscape).x,
			drawingListenPoint(visible, visible.landscape).y,
			2
		);

		expect(
			isDrawingVisibleInView([visible], 'visible', view, viewport, 'landscape', (d) => d.landscape)
		).toBe(true);
		expect(
			isDrawingVisibleInView([visible], 'offscreen', view, viewport, 'landscape', (d) => d.landscape)
		).toBe(false);
		expect(visibleDrawings([visible], view, viewport, 'landscape').map((h) => h.drawing.id)).toEqual([
			'visible'
		]);
		expect(
			visibleDrawings([visible, offscreen], view, viewport, 'landscape').map((h) => h.drawing.id)
		).toEqual(['visible']);
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
			isDrawingVisibleInView(drawings, 'maskers', focus, viewport, 'landscape', (d) =>
				layoutPos(d, 'landscape')
			)
		).toBe(true);
	});

	it('returns false for unknown ids', () => {
		expect(
			isDrawingVisibleInView(
				drawings,
				'missing',
				{ tx: 0, ty: 0, zoom: 1 },
				viewport,
				'landscape',
				(d) => layoutPos(d, 'landscape')
			)
		).toBe(false);
	});
});

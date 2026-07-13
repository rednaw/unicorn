import { describe, expect, it } from 'vitest';
import {
	canvasCentre,
	centreOnCanvas,
	clampView,
	clampZoom,
	fitViewToCanvas,
	fitZoomForItem,
	viewportToCanvas,
	zoomAtPoint
} from './view-math';

describe('clampZoom', () => {
	it('clamps to min and max', () => {
		expect(clampZoom(0.1, 0.25, 2)).toBe(0.25);
		expect(clampZoom(5, 0.25, 2)).toBe(2);
		expect(clampZoom(1, 0.25, 2)).toBe(1);
	});
});

describe('clampView', () => {
	it('keeps the canvas within pan slack', () => {
		const view = { tx: 500, ty: 500, zoom: 1 };
		const clamped = clampView(view, { width: 400, height: 300 }, { width: 800, height: 600 });
		expect(clamped.tx).toBeLessThan(view.tx);
		expect(clamped.ty).toBeLessThan(view.ty);
	});
});

describe('zoomAtPoint', () => {
	it('zooms around the cursor anchor', () => {
		const view = { tx: 0, ty: 0, zoom: 1 };
		const next = zoomAtPoint(view, 100, 100, 2, 0.25, 4);
		expect(next.zoom).toBe(2);
		expect(next.tx).toBe(-100);
		expect(next.ty).toBe(-100);
	});
});

describe('fitViewToCanvas', () => {
	it('fits the canvas inside the viewport with padding', () => {
		const view = fitViewToCanvas({ width: 1000, height: 800 }, 0.25, { width: 2000, height: 1000 }, 0.95);
		expect(view.zoom).toBeCloseTo(0.475);
		expect(view.tx).toBeCloseTo(25);
	});
});

describe('centreOnCanvas', () => {
	it('places a canvas point at the viewport centre', () => {
		const view = centreOnCanvas({ width: 400, height: 300 }, 500, 200, 2);
		expect(view.zoom).toBe(2);
		const mapped = viewportToCanvas(view, 200, 150);
		expect(mapped.x).toBeCloseTo(500);
		expect(mapped.y).toBeCloseTo(200);
	});
});

describe('fitZoomForItem', () => {
	it('chooses the limiting dimension', () => {
		const zoom = fitZoomForItem({ width: 400, height: 300 }, 800, 200, 0.9, 0.25, 4);
		expect(zoom).toBeCloseTo(0.45);
	});
});

describe('canvasCentre', () => {
	it('maps the viewport centre to canvas space', () => {
		const view = { tx: 10, ty: 20, zoom: 2 };
		const c = canvasCentre(view, { width: 400, height: 300 });
		expect(c.x).toBeCloseTo(95);
		expect(c.y).toBeCloseTo(65);
	});
});

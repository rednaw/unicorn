import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ATELIER_ANIM, ATELIER_ZOOM } from './constants';
import { drawingListenPoint } from './drawing-geometry';
import { createAtelierView } from './view.svelte';
import { mockDrawing } from '../../test/fixtures';
import type { ViewportMetrics } from './viewport-metrics';

const landscape: ViewportMetrics = { width: 1200, height: 800, left: 0, top: 0 };
const portrait: ViewportMetrics = { width: 390, height: 844, left: 0, top: 0 };

function installRafViaTimers() {
	vi.stubGlobal(
		'requestAnimationFrame',
		vi.fn((cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number)
	);
	vi.stubGlobal(
		'cancelAnimationFrame',
		vi.fn((id: number) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>))
	);
}

function sampleDrawings() {
	return [
		mockDrawing({
			id: 'piece-a',
			landscape: { x: 120, y: 80 },
			portrait: { x: 40, y: 60 },
			width: 300,
			rotation: 0,
			srcWidth: 3000,
			srcHeight: 4000
		})
	];
}

describe('createAtelierView', () => {
	beforeEach(() => {
		vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	function createView(metrics = landscape) {
		const view = createAtelierView(sampleDrawings());
		view.setMetrics(metrics);
		view.onViewportResize();
		view.resetView();
		return view;
	}

	it('fits the canvas on reset and reports isAtFitAll', () => {
		const view = createView();
		expect(view.isAtFitAll()).toBe(true);
		expect(view.layoutMode).toBe('landscape');
		expect(view.canvas.width).toBeGreaterThan(0);
	});

	it('pans away from the fit-all overview', () => {
		const view = createView();
		const before = view.getView();
		view.panBy(120, 80);
		expect(view.tx).not.toBe(before.tx);
		expect(view.ty).not.toBe(before.ty);
		expect(view.isAtFitAll()).toBe(false);
	});

	it('clamps zoom when applying zoom at a point', () => {
		const view = createView();
		view.applyZoomAt(600, 400, 0.01);
		expect(view.zoom).toBeGreaterThanOrEqual(ATELIER_ZOOM.min);
		view.applyZoomAt(600, 400, 999);
		expect(view.zoom).toBeLessThan(999);
	});

	it('switches layout mode when the viewport becomes portrait', () => {
		const view = createView();
		view.setMetrics(portrait);
		view.onViewportResize();
		expect(view.layoutMode).toBe('portrait');
		expect(view.isAtFitAll()).toBe(true);
	});

	it('focuses a drawing and calls onArrive immediately when motion is reduced', () => {
		vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
		const view = createView();
		const drawing = sampleDrawings()[0]!;
		const onArrive = vi.fn();

		view.focusDrawing(drawing, onArrive);

		expect(onArrive).toHaveBeenCalledOnce();
		expect(view.isAtFitAll()).toBe(false);
	});

	it('animates focus when motion is allowed', async () => {
		vi.useFakeTimers();
		installRafViaTimers();
		const view = createView();
		const drawing = sampleDrawings()[0]!;
		const onArrive = vi.fn();

		view.focusDrawing(drawing, onArrive);
		expect(onArrive).not.toHaveBeenCalled();

		vi.advanceTimersByTime(ATELIER_ANIM.focusDurationMs + 50);
		await awaitFlushRaf();

		expect(onArrive).toHaveBeenCalledOnce();
	});

	it('applies inertial panning until velocity decays', async () => {
		vi.useFakeTimers();
		installRafViaTimers();
		const view = createView();
		const startTx = view.tx;

		view.startInertia({ x: 0, y: 0, t: performance.now() }, { x: 0.5, y: 0 });

		for (let i = 0; i < 40; i++) {
			vi.advanceTimersByTime(16);
			await awaitFlushRaf();
		}

		expect(view.tx).not.toBe(startTx);
		view.stopInertia();
		const paused = view.tx;
		vi.advanceTimersByTime(100);
		await awaitFlushRaf();
		expect(view.tx).toBe(paused);
	});

	it('resetViewAnimated returns to fit-all', async () => {
		vi.useFakeTimers();
		installRafViaTimers();
		const view = createView();
		view.panBy(200, 100);
		expect(view.isAtFitAll()).toBe(false);

		const onDone = vi.fn();
		view.resetViewAnimated(onDone);

		vi.advanceTimersByTime(ATELIER_ANIM.viewDurationMs + 50);
		await awaitFlushRaf();

		expect(onDone).toHaveBeenCalledOnce();
		expect(view.isAtFitAll()).toBe(true);
	});

	it('zoomTo centres on a canvas point', () => {
		const view = createView();
		const drawing = sampleDrawings()[0]!;
		const { x, y } = drawingListenPoint(drawing, drawing.landscape);

		view.zoomTo(x, y, 1.5, false);

		expect(view.zoom).toBeCloseTo(1.5, 1);
	});
});

async function awaitFlushRaf() {
	await Promise.resolve();
	await Promise.resolve();
}

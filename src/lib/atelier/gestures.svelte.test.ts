import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ATELIER_GESTURES, ATELIER_ZOOM } from './constants';
import { createAtelierGestures, type AtelierGestureDeps } from './gestures.svelte';
import { drawingListenPoint } from './drawing-geometry';
import { shouldSuppressPieceButtonClick } from './piece-activation';
import { createAtelierView } from './view.svelte';
import type { AtelierView } from './view.svelte';
import { mockDrawing } from '$test/fixtures';
import type { Drawing } from '$lib/content';

function sampleDrawing(): Drawing {
	return mockDrawing({
		id: 'piece-a',
		landscape: { x: 120, y: 80 },
		width: 300,
		rotation: 0
	});
}

function createMockView(): AtelierView & {
	getView: ReturnType<typeof vi.fn>;
	setPan: ReturnType<typeof vi.fn>;
	applyZoomAt: ReturnType<typeof vi.fn>;
	panBy: ReturnType<typeof vi.fn>;
	stopInertia: ReturnType<typeof vi.fn>;
	startInertia: ReturnType<typeof vi.fn>;
	drawingPos: ReturnType<typeof vi.fn>;
} {
	let dragging = false;
	const state = { tx: 0, ty: 0, zoom: 1 };

	return {
		get tx() {
			return state.tx;
		},
		get ty() {
			return state.ty;
		},
		get zoom() {
			return state.zoom;
		},
		get dragging() {
			return dragging;
		},
		set dragging(value: boolean) {
			dragging = value;
		},
		metrics: { width: 1200, height: 800, left: 0, top: 0 },
		layoutMode: 'landscape',
		canvas: { width: 2000, height: 1500 },
		getView: vi.fn(() => ({ ...state })),
		setPan: vi.fn((tx: number, ty: number) => {
			state.tx = tx;
			state.ty = ty;
		}),
		applyZoomAt: vi.fn((_x: number, _y: number, zoom: number) => {
			state.zoom = zoom;
		}),
		panBy: vi.fn((dx: number, dy: number) => {
			state.tx += dx;
			state.ty += dy;
		}),
		stopInertia: vi.fn(),
		startInertia: vi.fn(),
		drawingPos: vi.fn((d: Drawing) => d.landscape),
		setMetrics: vi.fn(),
		syncClamp: vi.fn(),
		resetView: vi.fn(),
		isAtFitAll: vi.fn(),
		resetViewAnimated: vi.fn(),
		onViewportResize: vi.fn(),
		zoomTo: vi.fn(),
		focusDrawing: vi.fn(),
		dispose: vi.fn()
	} as unknown as AtelierView & {
		getView: ReturnType<typeof vi.fn>;
		setPan: ReturnType<typeof vi.fn>;
		applyZoomAt: ReturnType<typeof vi.fn>;
		panBy: ReturnType<typeof vi.fn>;
		stopInertia: ReturnType<typeof vi.fn>;
		startInertia: ReturnType<typeof vi.fn>;
		drawingPos: ReturnType<typeof vi.fn>;
	};
}

function viewportRect(left = 0, top = 0, width = 1200, height = 800) {
	return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) };
}

function setupDom(opts?: { piece?: boolean; back?: boolean }) {
	const viewport = document.createElement('div');
	viewport.getBoundingClientRect = () => viewportRect();

	let piece: HTMLElement | undefined;
	let back: HTMLElement | undefined;

	if (opts?.piece) {
		piece = document.createElement('button');
		piece.className = 'piece piece--drawing';
		piece.dataset.drawingId = 'piece-a';
		viewport.appendChild(piece);
	}

	if (opts?.back) {
		back = document.createElement('button');
		back.className = 'back';
		viewport.appendChild(back);
	}

	document.body.appendChild(viewport);
	return { viewport, piece, back };
}

function pointer(
	type: 'pointerdown' | 'pointermove' | 'pointerup',
	init: {
		pointerId: number;
		clientX: number;
		clientY: number;
		target: EventTarget;
		currentTarget: EventTarget;
		pointerType?: string;
		button?: number;
	}
) {
	const event = new PointerEvent(type, {
		bubbles: true,
		pointerId: init.pointerId,
		clientX: init.clientX,
		clientY: init.clientY,
		pointerType: init.pointerType ?? 'mouse',
		button: init.button ?? 0
	});
	Object.defineProperty(event, 'target', { value: init.target, configurable: true });
	Object.defineProperty(event, 'currentTarget', { value: init.currentTarget, configurable: true });
	return event;
}

function createHarness(opts?: { piece?: boolean; back?: boolean; drawings?: Drawing[] }) {
	const view = createMockView();
	const drawings = opts?.drawings ?? [sampleDrawing()];
	const onExplore = vi.fn();
	const onPrefetchDrawing = vi.fn();
	const onFocusPiece = vi.fn();
	const { viewport, piece, back } = setupDom({ piece: opts?.piece, back: opts?.back });

	const deps: AtelierGestureDeps = {
		drawings,
		onExplore,
		onPrefetchDrawing,
		onFocusPiece,
		viewport: () => viewport
	};

	const gestures = createAtelierGestures(view, deps);

	return { view, gestures, viewport, piece, back, onExplore, onPrefetchDrawing, onFocusPiece };
}

describe('createAtelierGestures', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('focuses a piece on tap and suppresses the follow-up button click', () => {
		const { gestures, viewport, piece, onFocusPiece, onPrefetchDrawing } = createHarness({ piece: true });

		gestures.onPointerDown(
			pointer('pointerdown', { pointerId: 1, clientX: 50, clientY: 50, target: piece!, currentTarget: viewport })
		);
		expect(onPrefetchDrawing).toHaveBeenCalledWith('piece-a');

		gestures.onPointerUp(
			pointer('pointerup', { pointerId: 1, clientX: 50, clientY: 50, target: piece!, currentTarget: viewport })
		);

		expect(onFocusPiece).toHaveBeenCalledWith('piece-a');
		expect(shouldSuppressPieceButtonClick()).toBe(true);
	});

	it('pans instead of focusing when drag exceeds the piece threshold', () => {
		const { view, gestures, viewport, piece, onFocusPiece, onExplore } = createHarness({ piece: true });
		const threshold = ATELIER_GESTURES.panThresholdPiece + 5;

		gestures.onPointerDown(
			pointer('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, target: piece!, currentTarget: viewport })
		);
		gestures.onPointerMove(
			pointer('pointermove', {
				pointerId: 1,
				clientX: 100 + threshold,
				clientY: 100,
				target: piece!,
				currentTarget: viewport
			})
		);
		gestures.onPointerUp(
			pointer('pointerup', {
				pointerId: 1,
				clientX: 100 + threshold,
				clientY: 100,
				target: piece!,
				currentTarget: viewport
			})
		);

		expect(view.setPan).toHaveBeenCalled();
		expect(onExplore).toHaveBeenCalled();
		expect(onFocusPiece).not.toHaveBeenCalled();
	});

	it('starts inertia after a pan ends', () => {
		const { view, gestures, viewport, onFocusPiece } = createHarness({ piece: false });
		const threshold = ATELIER_GESTURES.panThresholdMouse + 5;

		gestures.onPointerDown(
			pointer('pointerdown', { pointerId: 1, clientX: 200, clientY: 200, target: viewport, currentTarget: viewport })
		);
		gestures.onPointerMove(
			pointer('pointermove', {
				pointerId: 1,
				clientX: 200 + threshold,
				clientY: 200,
				target: viewport,
				currentTarget: viewport
			})
		);
		gestures.onPointerUp(
			pointer('pointerup', {
				pointerId: 1,
				clientX: 200 + threshold,
				clientY: 200,
				target: viewport,
				currentTarget: viewport
			})
		);

		expect(view.startInertia).toHaveBeenCalled();
		expect(onFocusPiece).not.toHaveBeenCalled();
	});

	it('ignores pointer down on the back control', () => {
		const { gestures, viewport, back, onFocusPiece, onPrefetchDrawing } = createHarness({ back: true });

		gestures.onPointerDown(
			pointer('pointerdown', { pointerId: 1, clientX: 10, clientY: 10, target: back!, currentTarget: viewport })
		);
		gestures.onPointerUp(
			pointer('pointerup', { pointerId: 1, clientX: 10, clientY: 10, target: back!, currentTarget: viewport })
		);

		expect(onPrefetchDrawing).not.toHaveBeenCalled();
		expect(onFocusPiece).not.toHaveBeenCalled();
	});

	it('focuses via canvas hit-test when the viewport holds pointer capture', () => {
		const drawing = sampleDrawing();
		const atelierView = createAtelierView([drawing]);
		atelierView.setMetrics({ width: 1200, height: 800, left: 0, top: 0 });
		atelierView.onViewportResize();
		atelierView.resetView();

		const { x: cx, y: cy } = drawingListenPoint(drawing, drawing.landscape);
		const v = atelierView.getView();
		const clientX = cx * v.zoom + v.tx;
		const clientY = cy * v.zoom + v.ty;

		const viewport = document.createElement('div');
		viewport.getBoundingClientRect = () => viewportRect();
		document.body.appendChild(viewport);

		const onFocusPiece = vi.fn();
		const gestures = createAtelierGestures(atelierView, {
			drawings: [drawing],
			onExplore: vi.fn(),
			onPrefetchDrawing: vi.fn(),
			onFocusPiece,
			viewport: () => viewport
		});

		gestures.onPointerDown(
			pointer('pointerdown', {
				pointerId: 1,
				clientX,
				clientY,
				target: viewport,
				currentTarget: viewport
			})
		);
		gestures.onPointerUp(
			pointer('pointerup', {
				pointerId: 1,
				clientX,
				clientY,
				target: viewport,
				currentTarget: viewport
			})
		);

		expect(onFocusPiece).toHaveBeenCalledWith('piece-a');
	});

	it('pinch-zooms and does not focus on release', () => {
		const { view, gestures, viewport, onFocusPiece, onExplore } = createHarness({ piece: true });

		gestures.onPointerDown(
			pointer('pointerdown', {
				pointerId: 1,
				clientX: 100,
				clientY: 100,
				target: viewport,
				currentTarget: viewport,
				pointerType: 'touch'
			})
		);
		gestures.onPointerDown(
			pointer('pointerdown', {
				pointerId: 2,
				clientX: 200,
				clientY: 100,
				target: viewport,
				currentTarget: viewport,
				pointerType: 'touch'
			})
		);
		gestures.onPointerMove(
			pointer('pointermove', {
				pointerId: 2,
				clientX: 280,
				clientY: 100,
				target: viewport,
				currentTarget: viewport,
				pointerType: 'touch'
			})
		);

		expect(view.applyZoomAt).toHaveBeenCalled();
		expect(onExplore).toHaveBeenCalled();

		gestures.onPointerUp(
			pointer('pointerup', {
				pointerId: 1,
				clientX: 100,
				clientY: 100,
				target: viewport,
				currentTarget: viewport,
				pointerType: 'touch'
			})
		);
		gestures.onPointerUp(
			pointer('pointerup', {
				pointerId: 2,
				clientX: 280,
				clientY: 100,
				target: viewport,
				currentTarget: viewport,
				pointerType: 'touch'
			})
		);

		expect(onFocusPiece).not.toHaveBeenCalled();
	});

	it('zooms on mouse wheel notches and pans on trackpad scroll', () => {
		const { view, gestures, viewport, onExplore } = createHarness();

		const wheelLine = new WheelEvent('wheel', {
			deltaY: 120,
			deltaMode: WheelEvent.DOM_DELTA_LINE,
			clientX: 400,
			clientY: 300
		});
		Object.defineProperty(wheelLine, 'currentTarget', { value: viewport, configurable: true });
		gestures.onWheel(wheelLine);

		expect(view.applyZoomAt).toHaveBeenCalled();
		expect(onExplore).toHaveBeenCalled();

		const wheelPixel = new WheelEvent('wheel', {
			deltaX: 10,
			deltaY: 20,
			deltaMode: WheelEvent.DOM_DELTA_PIXEL,
			clientX: 400,
			clientY: 300
		});
		Object.defineProperty(wheelPixel, 'currentTarget', { value: viewport, configurable: true });
		gestures.onWheel(wheelPixel);

		expect(view.panBy).toHaveBeenCalledWith(-10, -20);
	});

	it('pans and zooms from keyboard when the canvas is focused', () => {
		const { view, gestures, viewport, onExplore } = createHarness();

		const left = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
		Object.defineProperty(left, 'target', { value: viewport, configurable: true });
		gestures.onKeyDown(left);

		expect(view.panBy).toHaveBeenCalledWith(ATELIER_ZOOM.keyboardPan, 0);
		expect(onExplore).toHaveBeenCalled();

		const zoomIn = new KeyboardEvent('keydown', { key: '+', bubbles: true });
		Object.defineProperty(zoomIn, 'target', { value: viewport, configurable: true });
		gestures.onKeyDown(zoomIn);

		expect(view.applyZoomAt).toHaveBeenCalled();
	});

	it('ignores keyboard shortcuts with modifiers and when a piece is focused', () => {
		const { view, gestures, viewport, piece } = createHarness({ piece: true });

		const modified = new KeyboardEvent('keydown', { key: 'ArrowLeft', metaKey: true, bubbles: true });
		Object.defineProperty(modified, 'target', { value: viewport, configurable: true });
		gestures.onKeyDown(modified);
		expect(view.panBy).not.toHaveBeenCalled();

		const onPiece = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
		Object.defineProperty(onPiece, 'target', { value: piece!, configurable: true });
		gestures.onKeyDown(onPiece);
		expect(view.panBy).not.toHaveBeenCalled();
	});

	it('prevents default touchmove while a pointer gesture is active', () => {
		const { gestures, viewport } = createHarness();
		gestures.onPointerDown(
			pointer('pointerdown', { pointerId: 1, clientX: 10, clientY: 10, target: viewport, currentTarget: viewport })
		);

		const touchMove = new TouchEvent('touchmove', { cancelable: true });
		const preventDefault = vi.spyOn(touchMove, 'preventDefault');
		gestures.onTouchMove(touchMove);

		expect(preventDefault).toHaveBeenCalled();
	});

	it('ignores non-primary pointer buttons', () => {
		const { gestures, viewport, piece, onPrefetchDrawing } = createHarness({ piece: true });

		gestures.onPointerDown(
			pointer('pointerdown', {
				pointerId: 1,
				clientX: 50,
				clientY: 50,
				target: piece!,
				currentTarget: viewport,
				button: 2
			})
		);

		expect(onPrefetchDrawing).not.toHaveBeenCalled();
	});
});

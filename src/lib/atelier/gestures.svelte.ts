import { drawings } from '$lib/content';
import { ATELIER_GESTURES, ATELIER_INTERACTIVE_SELECTOR, ATELIER_ZOOM } from './constants';
import { drawingAtCanvasPoint } from './drawing-geometry';
import { viewportToCanvas } from './view-math';
import type { AtelierView } from './view.svelte';

type InteractionMode = 'idle' | 'pending-pan' | 'panning' | 'pinching';

type PinchState = { midX: number; midY: number; dist: number };

export type AtelierGestureDeps = {
	unlock: () => void;
	onPrefetchDrawing: (id: string) => void;
	onEscape: () => void;
	/** Refresh cached viewport offset at pinch start (one layout read per gesture). */
	syncViewportOffset: () => void;
};

export function createAtelierGestures(view: AtelierView, deps: AtelierGestureDeps) {
	const pointers = new Map<number, { x: number; y: number }>();

	let interactionMode: InteractionMode = 'idle';
	let primaryPointerId: number | null = null;
	let primaryPointerType = 'mouse';
	let startedOnPiece = false;
	let pinch: PinchState | undefined;

	let dragStart = { x: 0, y: 0, tx: 0, ty: 0 };
	let lastMove: { x: number; y: number; t: number } | null = null;
	let vx = 0;
	let vy = 0;

	let lastTapTime = 0;
	let lastTapX = 0;
	let lastTapY = 0;

	function panThreshold() {
		if (primaryPointerType !== 'touch') return ATELIER_GESTURES.panThresholdMouse;
		return startedOnPiece ? ATELIER_GESTURES.panThresholdPiece : ATELIER_GESTURES.panThresholdTouch;
	}

	function prefetchAtViewport(viewportX: number, viewportY: number) {
		const canvas = viewportToCanvas(view.getView(), viewportX, viewportY);
		const id = drawingAtCanvasPoint(drawings, canvas.x, canvas.y, (d) => view.drawingPos(d));
		if (id) deps.onPrefetchDrawing(id);
	}

	function startPinch() {
		if (pointers.size < 2) return;
		deps.syncViewportOffset();
		const { left, top } = view.metrics;
		const [a, b] = Array.from(pointers.values()).slice(0, 2);
		pinch = {
			midX: (a.x + b.x) / 2 - left,
			midY: (a.y + b.y) / 2 - top,
			dist: Math.hypot(b.x - a.x, b.y - a.y)
		};
	}

	function updatePinch() {
		if (!pinch || pointers.size < 2) return;
		const { left, top } = view.metrics;
		const [a, b] = Array.from(pointers.values()).slice(0, 2);
		const midX = (a.x + b.x) / 2 - left;
		const midY = (a.y + b.y) / 2 - top;
		const dist = Math.hypot(b.x - a.x, b.y - a.y);

		const current = view.getView();
		view.setPan(current.tx + midX - pinch.midX, current.ty + midY - pinch.midY);
		view.applyZoomAt(midX, midY, current.zoom * (dist / pinch.dist));
		prefetchAtViewport(midX, midY);

		pinch = { midX, midY, dist };
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		deps.unlock();
		view.stopInertia();

		if (pointers.size === 0) {
			const target = e.target as HTMLElement;
			startedOnPiece = !!target.closest('.piece--drawing');
			const pieceId = target.closest('[data-drawing-id]')?.getAttribute('data-drawing-id');
			if (pieceId) deps.onPrefetchDrawing(pieceId);
			if (target.closest('.back')) return;
		}

		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {}

		if (pointers.size === 1) {
			primaryPointerId = e.pointerId;
			primaryPointerType = e.pointerType || 'mouse';
			const current = view.getView();
			dragStart = { x: e.clientX, y: e.clientY, tx: current.tx, ty: current.ty };
			lastMove = { x: e.clientX, y: e.clientY, t: performance.now() };
			vx = 0;
			vy = 0;
			view.dragging = false;
			interactionMode = 'pending-pan';
		} else if (pointers.size === 2) {
			view.dragging = false;
			interactionMode = 'pinching';
			startPinch();
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (!pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size >= 2 || interactionMode === 'pinching') {
			interactionMode = 'pinching';
			updatePinch();
			return;
		}

		if (interactionMode === 'pending-pan' && e.pointerId === primaryPointerId) {
			const moved = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
			if (moved >= panThreshold()) {
				interactionMode = 'panning';
				view.dragging = true;
			}
		}

		if (interactionMode === 'panning' && e.pointerId === primaryPointerId) {
			view.setPan(dragStart.tx + (e.clientX - dragStart.x), dragStart.ty + (e.clientY - dragStart.y));

			const now = performance.now();
			if (lastMove) {
				const dt = now - lastMove.t;
				if (dt > 0) {
					const nvx = (e.clientX - lastMove.x) / dt;
					const nvy = (e.clientY - lastMove.y) / dt;
					vx = vx * 0.2 + nvx * 0.8;
					vy = vy * 0.2 + nvy * 0.8;
				}
			}
			lastMove = { x: e.clientX, y: e.clientY, t: now };
		}
	}

	function onPointerUp(e: PointerEvent) {
		pointers.delete(e.pointerId);
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {}

		if (pointers.size < 2) pinch = undefined;
		if (pointers.size === 0) {
			const wasPanning = interactionMode === 'panning';
			view.dragging = false;
			interactionMode = 'idle';
			primaryPointerId = null;
			if (wasPanning) {
				view.startInertia(lastMove, { x: vx, y: vy });
			} else if (
				primaryPointerType === 'touch' &&
				!(e.target as HTMLElement).closest(ATELIER_INTERACTIVE_SELECTOR)
			) {
				const now = performance.now();
				const { left, top } = view.metrics;
				if (
					now - lastTapTime < ATELIER_GESTURES.dblTapWindowMs &&
					Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < ATELIER_GESTURES.dblTapSlopPx
				) {
					view.zoomAtViewport(
						e.clientX - left,
						e.clientY - top,
						ATELIER_ZOOM.dblTapFactor
					);
					lastTapTime = 0;
				} else {
					lastTapTime = now;
					lastTapX = e.clientX;
					lastTapY = e.clientY;
				}
			}
		} else if (pointers.size === 1) {
			const [p] = pointers.values();
			const current = view.getView();
			dragStart = { x: p.x, y: p.y, tx: current.tx, ty: current.ty };
			const [id] = pointers.keys();
			primaryPointerId = id;
			primaryPointerType = 'touch';
			view.dragging = false;
			interactionMode = 'pending-pan';
		}
	}

	function onWheel(e: WheelEvent) {
		deps.unlock();
		view.stopInertia();
		e.preventDefault();

		const { left, top, height } = view.metrics;
		const cx = e.clientX - left;
		const cy = e.clientY - top;
		const deltaUnit =
			e.deltaMode === WheelEvent.DOM_DELTA_LINE
				? 16
				: e.deltaMode === WheelEvent.DOM_DELTA_PAGE
					? height
					: 1;
		const dx = e.deltaX * deltaUnit;
		const dy = e.deltaY * deltaUnit;

		if (e.ctrlKey || e.metaKey) {
			const current = view.getView();
			view.applyZoomAt(cx, cy, current.zoom * Math.exp(-dy * ATELIER_ZOOM.wheelExp));
			prefetchAtViewport(cx, cy);
		} else {
			view.panBy(-dx, -dy);
		}
	}

	function onDblClick(e: MouseEvent) {
		if ((e.target as HTMLElement).closest(ATELIER_INTERACTIVE_SELECTOR)) return;
		view.stopInertia();
		const { left, top } = view.metrics;
		const current = view.getView();
		view.applyZoomAt(
			e.clientX - left,
			e.clientY - top,
			current.zoom * ATELIER_ZOOM.dblTapFactor
		);
	}

	function onKeyDown(e: KeyboardEvent) {
		// Leave browser/OS shortcuts (⌘R, ⌘0, ⌘←, …) untouched.
		if (e.metaKey || e.ctrlKey || e.altKey) return;

		const { width, height } = view.metrics;
		let handled = true;

		switch (e.key) {
			case 'ArrowLeft':
			case 'a':
			case 'A':
				view.panBy(ATELIER_ZOOM.keyboardPan, 0);
				break;
			case 'ArrowRight':
			case 'd':
			case 'D':
				view.panBy(-ATELIER_ZOOM.keyboardPan, 0);
				break;
			case 'ArrowUp':
			case 'w':
			case 'W':
				view.panBy(0, ATELIER_ZOOM.keyboardPan);
				break;
			case 'ArrowDown':
			case 's':
			case 'S':
				view.panBy(0, -ATELIER_ZOOM.keyboardPan);
				break;
			case '+':
			case '=': {
				const current = view.getView();
				view.applyZoomAt(width / 2, height / 2, current.zoom * ATELIER_ZOOM.keyboardStep);
				break;
			}
			case '-':
			case '_': {
				const current = view.getView();
				view.applyZoomAt(width / 2, height / 2, current.zoom / ATELIER_ZOOM.keyboardStep);
				break;
			}
			case '0':
			case 'r':
			case 'R':
				view.resetView();
				break;
			case 'Escape':
				deps.onEscape();
				break;
			default:
				handled = false;
		}

		if (handled) {
			deps.unlock();
			e.preventDefault();
			view.stopInertia();
		}
	}

	function onTouchMove(e: TouchEvent) {
		if (pointers.size > 0) e.preventDefault();
	}

	return {
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onWheel,
		onDblClick,
		onKeyDown,
		onTouchMove
	};
}

export type AtelierGestures = ReturnType<typeof createAtelierGestures>;

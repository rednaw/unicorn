import { drawings } from '$lib/content';
import { ATELIER_GESTURES, ATELIER_ZOOM } from './constants';
import { drawingAtCanvasPoint } from './drawing-geometry';
import { suppressNextPieceButtonClick } from './piece-activation';
import { viewportToCanvas } from './view-math';
import type { AtelierView } from './view.svelte';

type InteractionMode = 'idle' | 'pending-pan' | 'panning' | 'pinching';

type PinchState = { midX: number; midY: number; dist: number; left: number; top: number };

export type AtelierGestureDeps = {
	/** Visitor panned/zoomed — dismiss ended listening HUD; playback continues while playing. */
	onExplore: () => void;
	onPrefetchDrawing: (id: string) => void;
	onFocusPiece: (id: string) => void;
	onEscape: () => void;
	viewport: () => HTMLElement | undefined;
};

function viewportOrigin(el: HTMLElement) {
	const rect = el.getBoundingClientRect();
	return { left: rect.left, top: rect.top };
}

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

	function panThreshold() {
		if (startedOnPiece) return ATELIER_GESTURES.panThresholdPiece;
		return primaryPointerType === 'touch'
			? ATELIER_GESTURES.panThresholdTouch
			: ATELIER_GESTURES.panThresholdMouse;
	}

	function engage() {
		deps.onExplore();
	}

	function focusPiece(id: string) {
		suppressNextPieceButtonClick();
		deps.onFocusPiece(id);
	}

	function prefetchAtViewport(viewportX: number, viewportY: number) {
		const canvas = viewportToCanvas(view.getView(), viewportX, viewportY);
		const id = drawingAtCanvasPoint(drawings, canvas.x, canvas.y, (d) => view.drawingPos(d));
		if (id) deps.onPrefetchDrawing(id);
	}

	function startPinch() {
		if (pointers.size < 2) return;
		const vp = deps.viewport();
		if (!vp) return;
		const { left, top } = viewportOrigin(vp);
		const [a, b] = Array.from(pointers.values()).slice(0, 2);
		pinch = {
			midX: (a.x + b.x) / 2 - left,
			midY: (a.y + b.y) / 2 - top,
			dist: Math.hypot(b.x - a.x, b.y - a.y),
			left,
			top
		};
	}

	function updatePinch() {
		if (!pinch || pointers.size < 2) return;
		const { left, top } = pinch;
		const [a, b] = Array.from(pointers.values()).slice(0, 2);
		const midX = (a.x + b.x) / 2 - left;
		const midY = (a.y + b.y) / 2 - top;
		const dist = Math.hypot(b.x - a.x, b.y - a.y);

		const current = view.getView();
		view.setPan(current.tx + midX - pinch.midX, current.ty + midY - pinch.midY);
		view.applyZoomAt(midX, midY, current.zoom * (dist / pinch.dist));
		engage();
		prefetchAtViewport(midX, midY);

		pinch = { midX, midY, dist, left, top };
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		const target = e.target as HTMLElement;
		const pieceId = target.closest('[data-drawing-id]')?.getAttribute('data-drawing-id') ?? undefined;
		view.stopInertia();

		if (pointers.size === 0) {
			const target = e.target as HTMLElement;
			startedOnPiece = !!target.closest('.piece--drawing');
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
				engage();
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
				startedOnPiece = false;
				return;
			}

			const moved = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
			// Piece taps: let the <button> click focus (one path). Pointer-up hit test
			// here would double-fire on touch after the synthesized click.
			if (startedOnPiece && moved < ATELIER_GESTURES.panThresholdPiece) {
				startedOnPiece = false;
				return;
			}

			const vp = deps.viewport();
			if (vp && moved < ATELIER_GESTURES.panThresholdPiece) {
				const { left, top } = viewportOrigin(vp);
				const viewportX = e.clientX - left;
				const viewportY = e.clientY - top;
				const canvas = viewportToCanvas(view.getView(), viewportX, viewportY);
				const hitId = drawingAtCanvasPoint(drawings, canvas.x, canvas.y, (d) =>
					view.drawingPos(d)
				);
				if (hitId) focusPiece(hitId);
			}

			startedOnPiece = false;
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

	function wheelZooms(e: WheelEvent): boolean {
		if (e.ctrlKey || e.metaKey) return true;
		// Mouse wheel notches (LINE) → zoom at cursor. Trackpad two-finger scroll
		// (PIXEL, no modifier) → pan — same split as Maps/Figma-style canvas UIs.
		return (
			e.deltaMode === WheelEvent.DOM_DELTA_LINE &&
			Math.abs(e.deltaY) >= Math.abs(e.deltaX)
		);
	}

	function onWheel(e: WheelEvent) {
		engage();
		view.stopInertia();
		e.preventDefault();

		const vp = e.currentTarget as HTMLElement;
		const { left, top, height } = vp.getBoundingClientRect();
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

		if (wheelZooms(e)) {
			const current = view.getView();
			const exp =
				e.deltaMode === WheelEvent.DOM_DELTA_PIXEL
					? ATELIER_ZOOM.wheelPinchExp
					: ATELIER_ZOOM.wheelExp;
			view.applyZoomAt(cx, cy, current.zoom * Math.exp(-dy * exp));
			prefetchAtViewport(cx, cy);
		} else {
			view.panBy(-dx, -dy);
		}
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
			engage();
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
		onKeyDown,
		onTouchMove
	};
}

export type AtelierGestures = ReturnType<typeof createAtelierGestures>;

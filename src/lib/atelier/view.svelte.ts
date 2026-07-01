import type { Drawing } from '$lib/content';
import { maxSharpZoomForDrawing } from '$lib/content-derive';
import {
	computeAtelierCanvas,
	layoutPos,
	resolveLayoutMode,
	type AtelierLayoutMode
} from './atelier-layout';
import { ATELIER_ANIM, ATELIER_GESTURES, ATELIER_ZOOM } from './constants';
import { drawingAtCanvasPoint, drawingListenPoint, pieceBounds } from './drawing-geometry';
import { prefersReducedMotion, smoothstep } from './math';
import {
	centreOnCanvas,
	clampView,
	fitViewToCanvas,
	fitZoomForItem,
	viewportToCanvas,
	zoomAtPoint,
	type ViewTransform,
	type ViewportRect
} from './view-math';
import { EMPTY_VIEWPORT, type ViewportMetrics } from './viewport-metrics';

export function createAtelierView(drawings: Drawing[]) {
	const peakMaxZoom = Math.max(...drawings.map(maxSharpZoomForDrawing));

	function maxZoomAt(viewportX: number, viewportY: number): number {
		const canvas = viewportToCanvas(getView(), viewportX, viewportY);
		const id = drawingAtCanvasPoint(drawings, canvas.x, canvas.y, drawingPos);
		if (!id) return peakMaxZoom;
		const d = drawings.find((x) => x.id === id);
		return d ? maxSharpZoomForDrawing(d) : peakMaxZoom;
	}
	function readInitialViewport(): ViewportMetrics {
		if (typeof window === 'undefined') return EMPTY_VIEWPORT;
		return {
			width: window.innerWidth,
			height: window.innerHeight,
			left: 0,
			top: 0
		};
	}

	let tx = $state(0);
	let ty = $state(0);
	let zoom = $state<number>(ATELIER_ZOOM.initial);
	let hasUserNavigatedView = $state(false);
	let dragging = $state(false);
	const initialMetrics = readInitialViewport();
	let metrics = $state<ViewportMetrics>(initialMetrics);
	let layoutMode = $state<AtelierLayoutMode>(
		initialMetrics.width > 0 ? resolveLayoutMode(initialMetrics) : 'landscape'
	);

	let inertiaRaf = 0;
	let viewAnimRaf = 0;
	let vx = 0;
	let vy = 0;

	const minZoom = ATELIER_ZOOM.min;

	function getView(): ViewTransform {
		return { tx, ty, zoom };
	}

	function applyView(next: ViewTransform) {
		tx = next.tx;
		ty = next.ty;
		zoom = next.zoom;
	}

	function viewportRect(): ViewportRect {
		return { width: metrics.width, height: metrics.height };
	}

	function canvasSize() {
		return computeAtelierCanvas(layoutMode);
	}

	function drawingPos(drawing: Drawing) {
		return layoutPos(drawing, layoutMode);
	}

	function syncLayoutMode(): boolean {
		if (metrics.width === 0) return false;
		const next = resolveLayoutMode(metrics);
		if (next === layoutMode) return false;
		layoutMode = next;
		hasUserNavigatedView = false;
		return true;
	}

	function syncClamp() {
		if (metrics.width === 0) return;
		applyView(clampView(getView(), viewportRect(), canvasSize()));
	}

	function stopViewAnim() {
		if (viewAnimRaf) cancelAnimationFrame(viewAnimRaf);
		viewAnimRaf = 0;
	}

	function stopInertia() {
		if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
		inertiaRaf = 0;
		stopViewAnim();
	}

	function animateView(
		targetTx: number,
		targetTy: number,
		targetZoom: number,
		duration: number = ATELIER_ANIM.viewDurationMs,
		onDone?: () => void
	) {
		stopViewAnim();
		const from = getView();
		const t0 = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - t0) / duration);
			const e = smoothstep(t);
			applyView({
				tx: from.tx + (targetTx - from.tx) * e,
				ty: from.ty + (targetTy - from.ty) * e,
				zoom: from.zoom + (targetZoom - from.zoom) * e
			});
			syncClamp();
			if (t < 1) viewAnimRaf = requestAnimationFrame(step);
			else {
				viewAnimRaf = 0;
				onDone?.();
			}
		};
		viewAnimRaf = requestAnimationFrame(step);
	}

	function startInertia(
		lastMove: { x: number; y: number; t: number } | null,
		velocity: { x: number; y: number }
	) {
		if (prefersReducedMotion()) return;
		if (lastMove && performance.now() - lastMove.t > ATELIER_GESTURES.inertiaStaleMs) return;
		if (Math.hypot(velocity.x, velocity.y) < ATELIER_GESTURES.inertiaMinVelocity) return;

		vx = velocity.x;
		vy = velocity.y;
		let last = performance.now();

		const step = (now: number) => {
			const dt = Math.max(1, now - last);
			last = now;
			tx += vx * dt;
			ty += vy * dt;
			syncClamp();
			hasUserNavigatedView = true;
			const decay = Math.pow(ATELIER_GESTURES.inertiaDecay, dt / 16.67);
			vx *= decay;
			vy *= decay;
			if (Math.hypot(vx, vy) < ATELIER_GESTURES.inertiaStopVelocity) {
				stopInertia();
				return;
			}
			inertiaRaf = requestAnimationFrame(step);
		};
		inertiaRaf = requestAnimationFrame(step);
	}

	function setMetrics(next: ViewportMetrics) {
		metrics = next;
	}

	let viewFitted = false;
	let lastFitWidth = 0;
	let lastFitHeight = 0;

	function fitAllView() {
		const isPortrait = layoutMode === 'portrait';
		return fitViewToCanvas(
			viewportRect(),
			minZoom,
			canvasSize(),
			isPortrait ? ATELIER_ZOOM.fitPaddingPortrait : ATELIER_ZOOM.fitPadding,
			isPortrait ? { top: ATELIER_ZOOM.fitInsetTopPortrait } : {}
		);
	}

	function resetView() {
		if (metrics.width === 0) return;
		applyView(fitAllView());
		syncClamp();
		hasUserNavigatedView = false;
		lastFitWidth = metrics.width;
		lastFitHeight = metrics.height;
	}

	function onViewportResize() {
		if (metrics.width === 0) return;
		const modeChanged = syncLayoutMode();
		const sizeChanged =
			Math.abs(metrics.width - lastFitWidth) > 0.5 ||
			Math.abs(metrics.height - lastFitHeight) > 0.5;
		if (modeChanged) {
			resetView();
			viewFitted = true;
		} else if (!viewFitted && !hasUserNavigatedView) {
			resetView();
			viewFitted = true;
		} else if (sizeChanged && hasUserNavigatedView) {
			syncClamp();
			lastFitWidth = metrics.width;
			lastFitHeight = metrics.height;
		}
	}

	function applyZoomAt(viewportX: number, viewportY: number, nextZoom: number) {
		applyView(
			zoomAtPoint(getView(), viewportX, viewportY, nextZoom, minZoom, maxZoomAt(viewportX, viewportY))
		);
		syncClamp();
		hasUserNavigatedView = true;
	}

	function panBy(dx: number, dy: number) {
		tx += dx;
		ty += dy;
		syncClamp();
		hasUserNavigatedView = true;
	}

	function setPan(nextTx: number, nextTy: number) {
		tx = nextTx;
		ty = nextTy;
		syncClamp();
		hasUserNavigatedView = true;
	}

	function zoomTo(
		centreX: number,
		centreY: number,
		target: number,
		animate = false,
		duration: number = ATELIER_ANIM.viewDurationMs,
		onDone?: () => void
	) {
		if (metrics.width === 0) {
			onDone?.();
			return;
		}
		const next = centreOnCanvas(viewportRect(), centreX, centreY, target);
		if (animate && !prefersReducedMotion()) {
			animateView(next.tx, next.ty, next.zoom, duration, onDone);
		} else {
			applyView(next);
			syncClamp();
			onDone?.();
		}
		hasUserNavigatedView = true;
	}

	function focusTargetZoom(itemW: number, itemH: number, fill: number, maxZoom: number) {
		if (metrics.width === 0) return zoom;
		return fitZoomForItem(viewportRect(), itemW, itemH, fill, minZoom, maxZoom);
	}

	function focusDrawing(d: Drawing, onArrive?: () => void) {
		const { width, height } = pieceBounds(d);
		const { x: cx, y: cy } = drawingListenPoint(d, drawingPos(d));
		const cap = maxSharpZoomForDrawing(d);
		const fitTarget = focusTargetZoom(width, height, ATELIER_ZOOM.focusFill, cap);
		const steppedTarget = Math.min(cap, zoom + ATELIER_ZOOM.focusStep);
		zoomTo(cx, cy, Math.max(fitTarget, steppedTarget), true, ATELIER_ANIM.focusDurationMs, onArrive);
	}

	function dispose() {
		stopInertia();
	}

	return {
		get tx() {
			return tx;
		},
		get ty() {
			return ty;
		},
		get zoom() {
			return zoom;
		},
		get dragging() {
			return dragging;
		},
		set dragging(value: boolean) {
			dragging = value;
		},
		get metrics() {
			return metrics;
		},
		get layoutMode() {
			return layoutMode;
		},
		get canvas() {
			return canvasSize();
		},
		drawingPos,
		getView,
		setMetrics,
		syncClamp,
		resetView,
		onViewportResize,
		applyZoomAt,
		panBy,
		setPan,
		zoomTo,
		focusDrawing,
		stopInertia,
		startInertia,
		dispose
	};
}

export type AtelierView = ReturnType<typeof createAtelierView>;

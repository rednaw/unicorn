import type { Drawing, Track } from '$lib/content';
import { ATELIER_ANIM, ATELIER_GESTURES, ATELIER_ZOOM } from './constants';
import { drawingSize } from './drawing-geometry';
import { prefersReducedMotion, smoothstep } from './math';
import { spatialSpeakerPoint } from './spatial-positions';
import {
	centreOnCanvas,
	clampView,
	fitViewToCanvas,
	fitZoomForItem,
	zoomAtPoint,
	type ViewTransform,
	type ViewportRect
} from './view-math';
import { EMPTY_VIEWPORT, type ViewportMetrics } from './viewport-metrics';

export function createAtelierView(maxZoom: number) {
	let tx = $state(0);
	let ty = $state(0);
	let zoom = $state<number>(ATELIER_ZOOM.initial);
	let hasUserNavigatedView = $state(false);
	let dragging = $state(false);
	let metrics = $state<ViewportMetrics>(EMPTY_VIEWPORT);

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

	function syncClamp() {
		if (metrics.width === 0) return;
		applyView(clampView(getView(), viewportRect()));
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
		duration = ATELIER_ANIM.viewDurationMs
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
			else viewAnimRaf = 0;
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

	function resetView() {
		if (metrics.width === 0) return;
		applyView(fitViewToCanvas(viewportRect(), minZoom, undefined, ATELIER_ZOOM.fitPadding));
		syncClamp();
		hasUserNavigatedView = false;
	}

	function onViewportResize() {
		if (hasUserNavigatedView) syncClamp();
		else resetView();
	}

	function applyZoomAt(viewportX: number, viewportY: number, nextZoom: number) {
		applyView(zoomAtPoint(getView(), viewportX, viewportY, nextZoom, minZoom, maxZoom));
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

	function zoomTo(centreX: number, centreY: number, target: number, animate = false) {
		if (metrics.width === 0) return;
		const next = centreOnCanvas(viewportRect(), centreX, centreY, target);
		if (animate && !prefersReducedMotion()) {
			animateView(next.tx, next.ty, next.zoom);
		} else {
			applyView(next);
			syncClamp();
		}
		hasUserNavigatedView = true;
	}

	function zoomAtViewport(viewportX: number, viewportY: number, factor: number) {
		const next = zoomAtPoint(getView(), viewportX, viewportY, zoom * factor, minZoom, maxZoom);
		if (prefersReducedMotion()) {
			applyView(next);
			syncClamp();
			hasUserNavigatedView = true;
		} else {
			stopInertia();
			animateView(next.tx, next.ty, next.zoom);
			hasUserNavigatedView = true;
		}
	}

	function focusTargetZoom(itemW: number, itemH: number, fill = 0.74) {
		if (metrics.width === 0) return zoom;
		return fitZoomForItem(viewportRect(), itemW, itemH, fill, minZoom, maxZoom);
	}

	function focusDrawing(d: Drawing) {
		const { width, height } = drawingSize(d);
		const cx = (d.pos?.x ?? 0) + width / 2;
		const cy = (d.pos?.y ?? 0) + height / 2;
		const fitTarget = focusTargetZoom(width, height, ATELIER_ZOOM.focusFill);
		const steppedTarget = Math.min(maxZoom, zoom + ATELIER_ZOOM.focusStep);
		zoomTo(cx, cy, Math.max(fitTarget, steppedTarget), true);
	}

	function focusSpeaker(track: Track) {
		const point = spatialSpeakerPoint(track);
		if (!point) return;
		stopInertia();
		zoomTo(point.x, point.y, Math.max(zoom, ATELIER_ZOOM.speakerMin), true);
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
		get hasUserNavigatedView() {
			return hasUserNavigatedView;
		},
		get metrics() {
			return metrics;
		},
		get maxZoom() {
			return maxZoom;
		},
		getView,
		setMetrics,
		syncClamp,
		resetView,
		onViewportResize,
		applyZoomAt,
		panBy,
		setPan,
		zoomTo,
		zoomAtViewport,
		focusDrawing,
		focusSpeaker,
		stopInertia,
		startInertia,
		dispose
	};
}

export type AtelierView = ReturnType<typeof createAtelierView>;

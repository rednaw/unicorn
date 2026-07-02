import type { Drawing } from '$lib/content';
import { prefetchVisibleInView, requestDrawing } from '$lib/drawing/prefetch.svelte';
import { observeBrowserChromeInsets } from './browser-chrome-insets';
import { ATELIER_PREFETCH } from './constants';
import { createAtelierGestures } from './gestures.svelte';
import { createPieceFocus } from './piece-focus.svelte';
import { armSpatial, enterSpatial, leaveSpatial, unlock } from './audio-engine.svelte';
import { createSpatialAudioLoop } from './spatial-audio-loop.svelte';
import { observeViewport } from './viewport-metrics';
import { createAtelierView } from './view.svelte';

/**
 * Atelier runtime — composes view, focus/pin, spatial audio, gestures, and prefetch.
 *
 *   page (+page.svelte)       — shell, mount refs, navigation
 *   atelier-session (here)    — orchestration
 *   view / piece-focus        — pan/zoom state, tap-focus pin
 *   spatial-mix               — pure proximity math
 *   spatial-audio-loop        — RAF: mix → applyMix, HUD near ids
 *   audio-engine (singleton)  — AudioContext, unlock, solo-near playback
 *   gestures                  — pointer/wheel/keyboard → session callbacks
 */
export function createAtelierSession(opts: {
	drawings: Drawing[];
	onNavigateHome: () => void;
}) {
	const pieceFocus = createPieceFocus();
	const view = createAtelierView(opts.drawings);
	const spatial = createSpatialAudioLoop(view, pieceFocus);

	let getViewport: () => HTMLDivElement | undefined = () => undefined;
	let settleTimer: ReturnType<typeof setTimeout> | undefined;

	function scheduleViewportPrefetch() {
		clearTimeout(settleTimer);
		settleTimer = setTimeout(() => {
			if (view.metrics.width === 0) return;
			prefetchVisibleInView(
				view.getView(),
				view.metrics,
				view.layoutMode,
				(d) => view.drawingPos(d)
			);
		}, ATELIER_PREFETCH.settleMs);
	}

	$effect(() => {
		view.tx;
		view.ty;
		view.zoom;
		view.layoutMode;
		scheduleViewportPrefetch();
	});

	function primeDrawingIds(hintId?: string): string[] {
		const ids: string[] = [];
		if (pieceFocus.pinnedDrawingId) ids.push(pieceFocus.pinnedDrawingId);
		if (spatial.dominantAudioDrawingId) ids.push(spatial.dominantAudioDrawingId);
		if (spatial.nearDrawingId && spatial.nearDrawingId !== spatial.dominantAudioDrawingId) {
			ids.push(spatial.nearDrawingId);
		}
		if (hintId && !ids.includes(hintId)) ids.push(hintId);
		return ids;
	}

	function onGestureAudio(hintDrawingId?: string) {
		void unlock(primeDrawingIds(hintDrawingId));
	}

	function onExplore() {
		armSpatial();
		pieceFocus.releasePin();
	}

	function focusDrawing(id: string) {
		void unlock([id]);
		pieceFocus.focus(id);
		armSpatial();
		requestDrawing(id, 'full');
		const drawing = opts.drawings.find((d) => d.id === id);
		if (drawing) view.focusDrawing(drawing, scheduleViewportPrefetch);
		else scheduleViewportPrefetch();
	}

	function goBack() {
		view.stopInertia();
		if (view.isAtFitAll()) {
			opts.onNavigateHome();
			return;
		}
		pieceFocus.clear();
		view.resetViewAnimated(() => {
			scheduleViewportPrefetch();
			armSpatial();
		});
	}

	const gestures = createAtelierGestures(view, {
		onGestureAudio,
		onExplore,
		onPrefetchDrawing: (id) => requestDrawing(id, 'full'),
		onFocusPiece: focusDrawing,
		onEscape: goBack,
		viewport: () => getViewport()
	});

	function start(refs: {
		getViewport: () => HTMLDivElement | undefined;
		getRoot: () => HTMLDivElement | undefined;
	}) {
		getViewport = refs.getViewport;

		enterSpatial();

		const viewportEl = getViewport();
		const rootEl = refs.getRoot();

		let unobserveViewport: (() => void) | undefined;
		let unobserveBrowserChrome: (() => void) | undefined;

		if (viewportEl) {
			view.onViewportResize();
			unobserveViewport = observeViewport(viewportEl, (metrics) => {
				view.setMetrics(metrics);
				view.onViewportResize();
			});
			viewportEl.addEventListener('wheel', gestures.onWheel, { passive: false });
			viewportEl.addEventListener('touchmove', gestures.onTouchMove, { passive: false });
		}

		if (rootEl) {
			requestAnimationFrame(() => {
				unobserveBrowserChrome = observeBrowserChromeInsets(rootEl);
			});
		}

		spatial.start();
		scheduleViewportPrefetch();
		window.addEventListener('keydown', gestures.onKeyDown);

		return () => {
			clearTimeout(settleTimer);
			unobserveViewport?.();
			unobserveBrowserChrome?.();
			viewportEl?.removeEventListener('wheel', gestures.onWheel);
			viewportEl?.removeEventListener('touchmove', gestures.onTouchMove);
			window.removeEventListener('keydown', gestures.onKeyDown);
			spatial.stop();
			view.dispose();
			leaveSpatial();
		};
	}

	return {
		view,
		gestures,
		get focusedId() {
			return pieceFocus.focusedId;
		},
		get displayNearDrawingId() {
			return spatial.displayNearDrawingId;
		},
		get nearCueDrawingId() {
			return spatial.nearCueDrawingId;
		},
		focusDrawing,
		goBack,
		start
	};
}

export type AtelierSession = ReturnType<typeof createAtelierSession>;

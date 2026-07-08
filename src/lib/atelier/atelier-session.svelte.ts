import type { Drawing } from '$lib/content';
import { prefetchVisibleInView, requestDrawing } from '$lib/drawing/prefetch.svelte';
import { observeBrowserChromeInsets } from './browser-chrome-insets';
import { ATELIER_AUDIO, ATELIER_PREFETCH } from './constants';
import { createAtelierGestures } from './gestures.svelte';
import { createListening } from './listening.svelte';
import {
	enterAtelier,
	leaveAtelier,
	playDrawing,
	setOnEnded,
	stop
} from './audio-player.svelte';
import { isDrawingVisibleInView } from './visible-drawings';
import { observeViewport } from './viewport-metrics';
import { createAtelierView } from './view.svelte';

/**
 * Atelier runtime — composes view, listening session, audio player, gestures, and prefetch.
 *
 *   page (+page.svelte)       — shell, mount refs, navigation
 *   atelier-session (here)    — orchestration
 *   view / listening          — pan/zoom state, tap-focus + HUD session
 *   audio-player (singleton)  — one track, gesture-owned play/stop
 *   gestures                  — pointer/wheel/keyboard → session callbacks
 */
export function createAtelierSession(opts: {
	drawings: Drawing[];
	onNavigateHome: () => void;
}) {
	const listening = createListening();
	const view = createAtelierView(opts.drawings);

	let viewFocusedId = $state<string | null>(null);

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

	setOnEnded(() => {
		if (listening.phase === 'playing') {
			listening.markEnded();
		}
	});

	function stopListeningAudio() {
		if (listening.drawingId) {
			stop({ fadeMs: ATELIER_AUDIO.crossfadeMs });
		}
	}

	function onExplore() {
		// Keep playback while panning/zooming — gramophone stays on until the
		// recording ends or the visitor returns to overview (goBack).
		if (listening.phase === 'ended') {
			listening.clear();
		}
	}

	function focusDrawing(id: string) {
		const drawing = opts.drawings.find((d) => d.id === id);
		viewFocusedId = id;
		// Silent works only reframe the view — leave any running recording playing.
		if (drawing?.track) {
			const replay = listening.drawingId === id && listening.phase === 'ended';
			listening.focus(id);
			void playDrawing(id, { fromStart: replay });
		}
		requestDrawing(id, 'full');
		if (drawing) view.focusDrawing(drawing, scheduleViewportPrefetch);
		else scheduleViewportPrefetch();
	}

	function goBack() {
		view.stopInertia();
		if (view.isAtFitAll()) {
			opts.onNavigateHome();
			return;
		}
		resetToOverview();
	}

	function resetToOverview() {
		stopListeningAudio();
		listening.clear();
		viewFocusedId = null;
		view.resetViewAnimated(scheduleViewportPrefetch);
	}

	const remoteHudVisible = $derived.by(() => {
		const id = listening.drawingId;
		if (!id) return false;
		const drawing = opts.drawings.find((d) => d.id === id);
		if (!drawing?.track) return false;
		view.tx;
		view.ty;
		view.zoom;
		view.layoutMode;
		view.metrics.width;
		if (view.metrics.width === 0) return false;
		return !isDrawingVisibleInView(
			id,
			view.getView(),
			view.metrics,
			view.layoutMode,
			(d) => view.drawingPos(d)
		);
	});

	const gestures = createAtelierGestures(view, {
		onExplore,
		onPrefetchDrawing: (id) => requestDrawing(id, 'full'),
		onFocusPiece: focusDrawing,
		viewport: () => getViewport()
	});

	function start(refs: {
		getViewport: () => HTMLDivElement | undefined;
		getRoot: () => HTMLDivElement | undefined;
	}) {
		getViewport = refs.getViewport;

		enterAtelier();

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

		scheduleViewportPrefetch();

		return () => {
			clearTimeout(settleTimer);
			unobserveViewport?.();
			unobserveBrowserChrome?.();
			viewportEl?.removeEventListener('wheel', gestures.onWheel);
			viewportEl?.removeEventListener('touchmove', gestures.onTouchMove);
			setOnEnded(undefined);
			view.dispose();
			leaveAtelier();
		};
	}

	return {
		view,
		gestures,
		get focusedId() {
			return viewFocusedId;
		},
		get hudDrawingId() {
			return listening.hudDrawingId;
		},
		get hudEnded() {
			return listening.hudEnded;
		},
		get hudVisible() {
			return remoteHudVisible;
		},
		isPlaying: (id: string) => listening.isPlaying(id),
		focusDrawing,
		goBack,
		start
	};
}

export type AtelierSession = ReturnType<typeof createAtelierSession>;

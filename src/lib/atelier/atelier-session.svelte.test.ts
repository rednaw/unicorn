import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { ATELIER_ANIM, ATELIER_AUDIO, ATELIER_PREFETCH } from './constants';
import SessionHarness from './atelier-session.harness.svelte';
import type { AtelierSession } from './atelier-session.svelte';
import { mockDrawing, mockTrack } from '../../test/fixtures';
import type { Drawing } from '$lib/content';

const audioMocks = vi.hoisted(() => {
	let onEnded: (() => void) | undefined;
	return {
		playDrawing: vi.fn(),
		stop: vi.fn((opts?: { onDone?: () => void }) => {
			opts?.onDone?.();
		}),
		enterAtelier: vi.fn(),
		leaveAtelier: vi.fn(),
		setOnEnded: vi.fn((cb?: () => void) => {
			onEnded = cb;
		}),
		fireEnded: () => onEnded?.(),
		reset: () => {
			onEnded = undefined;
		}
	};
});

const prefetchMocks = vi.hoisted(() => ({
	requestDrawing: vi.fn(),
	prefetchVisibleInView: vi.fn()
}));

const observerMocks = vi.hoisted(() => ({
	observeViewport: vi.fn(() => () => {}),
	observeBrowserChromeInsets: vi.fn(() => () => {})
}));

vi.mock('./audio-player.svelte', () => ({
	playDrawing: audioMocks.playDrawing,
	stop: audioMocks.stop,
	enterAtelier: audioMocks.enterAtelier,
	leaveAtelier: audioMocks.leaveAtelier,
	setOnEnded: audioMocks.setOnEnded
}));

vi.mock('$lib/drawing/prefetch.svelte', () => ({
	requestDrawing: prefetchMocks.requestDrawing,
	prefetchVisibleInView: prefetchMocks.prefetchVisibleInView
}));

vi.mock('./viewport-metrics', () => ({
	observeViewport: observerMocks.observeViewport,
	EMPTY_VIEWPORT: { width: 0, height: 0, left: 0, top: 0 }
}));

vi.mock('./browser-chrome-insets', () => ({
	observeBrowserChromeInsets: observerMocks.observeBrowserChromeInsets
}));

const mounted: ReturnType<typeof mount>[] = [];

const audioA = mockDrawing({
	id: 'piece-a',
	landscape: { x: 120, y: 80 },
	width: 300,
	rotation: 0,
	track: mockTrack({ id: 'track-a' })
});

const audioB = mockDrawing({
	id: 'piece-b',
	landscape: { x: 620, y: 480 },
	width: 300,
	rotation: 0,
	track: mockTrack({ id: 'track-b' })
});

const silent = mockDrawing({
	id: 'silent',
	landscape: { x: 1200, y: 900 },
	width: 300,
	rotation: 0
});

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

async function flushRaf() {
	await Promise.resolve();
	await Promise.resolve();
}

async function sessionReady(drawings: Drawing[] = [audioA, audioB, silent]) {
	const onNavigateHome = vi.fn();
	let session!: AtelierSession;
	const target = document.createElement('div');
	document.body.appendChild(target);

	const component = mount(SessionHarness, {
		target,
		props: {
			drawings,
			onNavigateHome,
			ready: (s) => {
				session = s;
			}
		}
	});
	mounted.push(component);

	await tick();
	session.view.setMetrics({ width: 1200, height: 800, left: 0, top: 0 });
	session.view.onViewportResize();
	session.view.resetView();
	return { session, onNavigateHome };
}

describe('createAtelierSession', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		audioMocks.reset();
		vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
		installRafViaTimers();
	});

	afterEach(() => {
		for (const component of mounted.splice(0)) {
			unmount(component);
		}
		document.body.innerHTML = '';
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('registers audio onEnded and marks the listening session ended', async () => {
		const { session } = await sessionReady();
		session.focusDrawing('piece-a');
		expect(session.isPlaying('piece-a')).toBe(true);

		audioMocks.fireEnded();
		expect(session.hudEnded).toBe(true);
	});

	it('focuses a silent piece without starting audio', async () => {
		const { session } = await sessionReady();
		session.focusDrawing('silent');

		expect(session.focusedId).toBe('silent');
		expect(audioMocks.playDrawing).not.toHaveBeenCalled();
		expect(prefetchMocks.requestDrawing).toHaveBeenCalledWith([audioA, audioB, silent], 'silent', 'full');
		expect(session.view.isAtFitAll()).toBe(false);
	});

	it('starts audio on first tap and pauses on second tap', async () => {
		const { session } = await sessionReady();
		const drawings = [audioA, audioB, silent];

		session.focusDrawing('piece-a');
		expect(audioMocks.playDrawing).toHaveBeenCalledWith('piece-a', { fromStart: false });
		expect(session.isPlaying('piece-a')).toBe(true);

		session.focusDrawing('piece-a');
		expect(audioMocks.stop).toHaveBeenCalledWith({ fadeMs: ATELIER_AUDIO.crossfadeMs });
		expect(session.isPlaying('piece-a')).toBe(false);
		expect(prefetchMocks.requestDrawing).toHaveBeenCalledWith(drawings, 'piece-a', 'full');
	});

	it('resumes a paused piece', async () => {
		const { session } = await sessionReady();
		session.focusDrawing('piece-a');
		session.focusDrawing('piece-a');
		audioMocks.playDrawing.mockClear();

		session.focusDrawing('piece-a');
		expect(audioMocks.playDrawing).toHaveBeenCalledWith('piece-a');
		expect(session.isPlaying('piece-a')).toBe(true);
	});

	it('crossfades when switching between audio pieces', async () => {
		const { session } = await sessionReady();
		session.focusDrawing('piece-a');
		audioMocks.playDrawing.mockClear();

		session.focusDrawing('piece-b');

		expect(audioMocks.stop).toHaveBeenCalledWith({
			fadeMs: ATELIER_AUDIO.crossfadeMs,
			onDone: expect.any(Function)
		});
		expect(audioMocks.playDrawing).toHaveBeenCalledWith('piece-b', { fromStart: false });
		expect(session.isPlaying('piece-b')).toBe(true);
	});

	it('navigates home from goBack when already at fit-all', async () => {
		const { session, onNavigateHome } = await sessionReady();
		expect(session.view.isAtFitAll()).toBe(true);

		session.goBack();
		expect(onNavigateHome).toHaveBeenCalledOnce();
	});

	it('resets overview from goBack when zoomed in', async () => {
		vi.useFakeTimers();
		const { session, onNavigateHome } = await sessionReady();
		session.focusDrawing('piece-a');
		expect(session.view.isAtFitAll()).toBe(false);

		session.goBack();
		vi.advanceTimersByTime(ATELIER_ANIM.viewDurationMs + 50);
		await flushRaf();

		expect(onNavigateHome).not.toHaveBeenCalled();
		expect(audioMocks.stop).toHaveBeenCalledWith({ fadeMs: ATELIER_AUDIO.crossfadeMs });
		expect(session.focusedId).toBeNull();
		expect(session.hudDrawingId).toBeNull();
	});

	it('shows the remote HUD when a playing piece is off-screen', async () => {
		const { session } = await sessionReady();
		session.focusDrawing('piece-a');
		expect(session.hudVisible).toBe(false);

		session.view.setPan(-9000, -9000);
		expect(session.isPlaying('piece-a')).toBe(true);
		expect(session.hudVisible).toBe(true);
	});

	it('clears an ended HUD when the visitor explores', async () => {
		const { session } = await sessionReady();
		const viewport = document.createElement('div');
		viewport.getBoundingClientRect = () => ({
			left: 0,
			top: 0,
			width: 1200,
			height: 800,
			right: 1200,
			bottom: 800,
			x: 0,
			y: 0,
			toJSON: () => ({})
		});
		document.body.appendChild(viewport);

		session.focusDrawing('piece-a');
		audioMocks.fireEnded();
		expect(session.hudEnded).toBe(true);

		const wheel = new WheelEvent('wheel', {
			deltaX: 5,
			deltaY: 10,
			deltaMode: WheelEvent.DOM_DELTA_PIXEL,
			clientX: 100,
			clientY: 100
		});
		Object.defineProperty(wheel, 'currentTarget', { value: viewport, configurable: true });
		session.gestures.onWheel(wheel);

		expect(session.hudDrawingId).toBeNull();
	});

	it('schedules viewport prefetch after pan settles', async () => {
		vi.useFakeTimers();
		const { session } = await sessionReady();
		prefetchMocks.prefetchVisibleInView.mockClear();

		session.view.panBy(40, 20);
		expect(prefetchMocks.prefetchVisibleInView).not.toHaveBeenCalled();

		vi.advanceTimersByTime(ATELIER_PREFETCH.settleMs);
		expect(prefetchMocks.prefetchVisibleInView).toHaveBeenCalled();
	});

	it('wires viewport observers on start and cleans up on stop', async () => {
		const { session } = await sessionReady();
		const viewport = document.createElement('div');
		const root = document.createElement('div');
		const removeWheel = vi.spyOn(viewport, 'removeEventListener');

		const stop = session.start({
			getViewport: () => viewport,
			getRoot: () => root
		});

		expect(audioMocks.enterAtelier).toHaveBeenCalled();
		expect(observerMocks.observeViewport).toHaveBeenCalledWith(viewport, expect.any(Function));

		stop();
		expect(audioMocks.leaveAtelier).toHaveBeenCalled();
		expect(removeWheel).toHaveBeenCalledWith('wheel', session.gestures.onWheel);
	});
});

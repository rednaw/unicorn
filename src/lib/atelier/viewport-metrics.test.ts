import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { observeViewport } from './viewport-metrics';

type ResizeObserverEntry = {
	contentRect: { width: number; height: number };
};

class MockResizeObserver {
	static latest: MockResizeObserver | undefined;
	private callback: (entries: ResizeObserverEntry[]) => void;

	constructor(callback: (entries: ResizeObserverEntry[]) => void) {
		this.callback = callback;
		MockResizeObserver.latest = this;
	}

	observe = vi.fn();
	disconnect = vi.fn();

	emit(width: number, height: number) {
		this.callback([{ contentRect: { width, height } }]);
	}
}

function installRafSync() {
	vi.stubGlobal(
		'requestAnimationFrame',
		vi.fn((cb: FrameRequestCallback) => {
			cb(0);
			return 1;
		})
	);
	vi.stubGlobal('cancelAnimationFrame', vi.fn());
}

describe('observeViewport', () => {
	beforeEach(() => {
		MockResizeObserver.latest = undefined;
		vi.stubGlobal('ResizeObserver', MockResizeObserver);
		installRafSync();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('reports contentRect size via ResizeObserver', () => {
		const el = document.createElement('div');
		const onChange = vi.fn();
		observeViewport(el, onChange);

		expect(MockResizeObserver.latest?.observe).toHaveBeenCalledWith(el);
		MockResizeObserver.latest?.emit(820, 640);

		expect(onChange).toHaveBeenCalledWith({ width: 820, height: 640, left: 0, top: 0 });
	});

	it('disconnects on cleanup', () => {
		const el = document.createElement('div');
		const stop = observeViewport(el, vi.fn());
		const ro = MockResizeObserver.latest!;
		stop();
		expect(ro.disconnect).toHaveBeenCalled();
	});
});

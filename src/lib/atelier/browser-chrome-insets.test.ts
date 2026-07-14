import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { observeBrowserChromeInsets } from './browser-chrome-insets';

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

describe('observeBrowserChromeInsets', () => {
	beforeEach(() => {
		installRafSync();
		vi.stubGlobal('innerHeight', 800);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns a no-op when visualViewport is unavailable', () => {
		vi.stubGlobal('visualViewport', undefined);
		const stop = observeBrowserChromeInsets(document.createElement('div'));
		expect(stop()).toBeUndefined();
	});

	it('writes chrome inset CSS variables from visualViewport', () => {
		const listeners = new Map<string, () => void>();
		vi.stubGlobal('visualViewport', {
			offsetTop: 20,
			height: 720,
			addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
			removeEventListener: (type: string) => listeners.delete(type)
		});

		const el = document.createElement('div');
		observeBrowserChromeInsets(el);

		expect(el.style.getPropertyValue('--browser-chrome-top')).toBe('20px');
		expect(el.style.getPropertyValue('--browser-chrome-bottom')).toBe('60px');
	});

	it('cleans up listeners and CSS variables', () => {
		const vv = {
			offsetTop: 10,
			height: 750,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		};
		vi.stubGlobal('visualViewport', vv);
		const removeWindowListener = vi.spyOn(window, 'removeEventListener');

		const el = document.createElement('div');
		const stop = observeBrowserChromeInsets(el);
		stop();

		expect(vv.removeEventListener).toHaveBeenCalled();
		expect(removeWindowListener).toHaveBeenCalledWith('resize', expect.any(Function));
		expect(el.style.getPropertyValue('--browser-chrome-top')).toBe('');
		expect(el.style.getPropertyValue('--browser-chrome-bottom')).toBe('');
	});
});

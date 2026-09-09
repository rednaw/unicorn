import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickAudioSrc, vinylSrc } from './audio-format';

const WEBM = 'audio/webm; codecs="opus"';
const M4A = 'audio/mp4; codecs="mp4a.40.2"';

describe('vinylSrc', () => {
	it('inserts .vinyl before the m4a extension', () => {
		expect(vinylSrc('/audio/foo.m4a')).toBe('/audio/foo.vinyl.m4a');
	});

	it('is a no-op for non-m4a paths', () => {
		expect(vinylSrc('/audio/foo.webm')).toBe('/audio/foo.webm');
	});
});

describe('pickAudioSrc', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('prefers webm when only webm is supported', () => {
		vi.spyOn(HTMLAudioElement.prototype, 'canPlayType').mockImplementation((mime) =>
			mime === WEBM ? 'probably' : ''
		);
		expect(pickAudioSrc('/audio/foo.m4a')).toBe('/audio/foo.webm');
	});

	it('prefers m4a when only m4a is supported', () => {
		vi.spyOn(HTMLAudioElement.prototype, 'canPlayType').mockImplementation((mime) =>
			mime === M4A ? 'probably' : ''
		);
		expect(pickAudioSrc('/audio/foo.m4a')).toBe('/audio/foo.m4a');
	});

	it('prefers webm on non-WebKit when both formats are supported', () => {
		vi.spyOn(HTMLAudioElement.prototype, 'canPlayType').mockImplementation((mime) =>
			mime === WEBM || mime === M4A ? 'probably' : ''
		);
		vi.stubGlobal('navigator', { userAgent: 'Chrome/120' });
		expect(pickAudioSrc('/audio/foo.m4a')).toBe('/audio/foo.webm');
	});

	it('prefers m4a on WebKit when both formats are supported', () => {
		vi.spyOn(HTMLAudioElement.prototype, 'canPlayType').mockImplementation((mime) =>
			mime === WEBM || mime === M4A ? 'probably' : ''
		);
		vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 AppleWebKit/605.1.15 Safari/605.1.15' });
		expect(pickAudioSrc('/audio/foo.m4a')).toBe('/audio/foo.m4a');
	});
});

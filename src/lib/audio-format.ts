const WEBM_MIME = 'audio/webm; codecs="opus"';
const M4A_MIME = 'audio/mp4; codecs="mp4a.40.2"';

function canPlayType(mime: string): boolean {
	const probe = document.createElement('audio').canPlayType(mime);
	return probe === 'probably' || probe === 'maybe';
}

/** WebKit browsers without Chromium/Blink — prefer Voice Memo m4a when both work. */
export function isWebKitBrowser(): boolean {
	const ua = navigator.userAgent;
	return /AppleWebKit/i.test(ua) && !/Chrome|Chromium|Edg|OPR|SamsungBrowser/i.test(ua);
}

/** Derive the build-time WebM sibling of a committed m4a `src`. */
export function webmSrcFromM4a(m4aSrc: string): string {
	return m4aSrc.replace(/\.m4a$/i, '.webm');
}

/**
 * Pick the recording URL for this browser.
 * m4a masters stay in git; webm is generated at build and ignored by git.
 */
export function pickAudioSrc(m4aSrc: string): string {
	const webmSrc = webmSrcFromM4a(m4aSrc);
	const webm = canPlayType(WEBM_MIME);
	const m4a = canPlayType(M4A_MIME);

	if (webm && !m4a) return webmSrc;
	if (m4a && !webm) return m4aSrc;
	if (webm && m4a) return isWebKitBrowser() ? m4aSrc : webmSrc;
	return m4a ? m4aSrc : webmSrc;
}

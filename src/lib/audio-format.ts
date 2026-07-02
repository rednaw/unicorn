const WEBM_MIME = 'audio/webm; codecs="opus"';
const M4A_MIME = 'audio/mp4; codecs="mp4a.40.2"';

function canPlayType(mime: string): boolean {
	const probe = document.createElement('audio').canPlayType(mime);
	return probe === 'probably' || probe === 'maybe';
}

function isWebKitBrowser(): boolean {
	const ua = navigator.userAgent;
	return /AppleWebKit/i.test(ua) && !/Chrome|Chromium|Edg|OPR|SamsungBrowser/i.test(ua);
}

function webmSrcFromM4a(m4aSrc: string): string {
	return m4aSrc.replace(/\.m4a$/i, '.webm');
}

/** Pick the recording URL for this browser. */
export function pickAudioSrc(m4aSrc: string): string {
	const webmSrc = webmSrcFromM4a(m4aSrc);
	const webm = canPlayType(WEBM_MIME);
	const m4a = canPlayType(M4A_MIME);

	if (webm && !m4a) return webmSrc;
	if (m4a && !webm) return m4aSrc;
	if (webm && m4a) return isWebKitBrowser() ? m4aSrc : webmSrc;
	return m4a ? m4aSrc : webmSrc;
}

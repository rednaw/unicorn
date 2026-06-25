/** Resolved blob URLs — survives SPA navigation in the same tab. */
const ready = new Map<string, string>();

/** In-flight fetches deduped by URL. */
const pending = new Map<string, Promise<string>>();

/** Full-res JPEGs: one at a time. Thumbs fetch in parallel. */
let fullQueue = Promise.resolve();

function isThumb(url: string) {
	return url.includes('-thumb.webp');
}

export function peekCachedAsset(url: string): string | undefined {
	return ready.get(url);
}

/**
 * Fetch once per URL per session; returns a blob URL for `<img src>`.
 * With DevTools “disable cache”, browser HTTP cache is off — this is the dedupe layer.
 */
export function cacheAsset(url: string): Promise<string> {
	const cached = ready.get(url);
	if (cached) return Promise.resolve(cached);

	const inflight = pending.get(url);
	if (inflight) return inflight;

	const fetchOne = async (): Promise<string> => {
		const res = await fetch(url);
		if (!res.ok) return url;
		const blob = await res.blob();
		const objectUrl = URL.createObjectURL(blob);
		ready.set(url, objectUrl);
		return objectUrl;
	};

	const job = (isThumb(url) ? fetchOne() : fullQueue.then(fetchOne)).catch(() => url);

	if (!isThumb(url)) {
		fullQueue = job.then(
			() => {},
			() => {}
		);
	}

	pending.set(url, job);
	void job.finally(() => pending.delete(url));
	return job;
}

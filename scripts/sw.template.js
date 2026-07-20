/**
 * Service worker — cache-first for atelier media (drawings, hall, atelier UI, audio).
 * Cache name is stamped at build time from a hash of static media (drawings, audio, hall, atelier).
 */
const CACHE = 'unicorn-media-__CACHE_VERSION__';
const PRECACHE_URLS = __PRECACHE_URLS__;

/** Static media only — extension-guarded so dev paths like `/src/lib/atelier/*.css` and the `/atelier/` HTML route are never cached. */
const STATIC_MEDIA = /\/(drawings|audio|hall)\/[^/]+\.(?:jpe?g|webp|m4a|webm)$/i;
const ATELIER_STATIC = /\/atelier\/[^/]+\.(?:webp|jpe?g|png|svg|m4a|webm)$/i;

function isStaticMediaPathname(pathname) {
	return STATIC_MEDIA.test(pathname) || ATELIER_STATIC.test(pathname);
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			if (PRECACHE_URLS.length > 0) {
				const cache = await caches.open(CACHE);
				await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
			}
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(
				keys
					.filter((key) => key.startsWith('unicorn-media-') && key !== CACHE)
					.map((key) => caches.delete(key))
			);
			// Drop entries cached under the old broad `/atelier/` path matcher.
			const cache = await caches.open(CACHE);
			const entries = await cache.keys();
			await Promise.all(
				entries
					.filter((req) => !isStaticMediaPathname(new URL(req.url).pathname))
					.map((req) => cache.delete(req))
			);
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;
	if (request.mode === 'navigate') return;
	if (!isStaticMediaPathname(url.pathname)) return;

	if (url.pathname.includes('/audio/')) {
		event.respondWith(handleAudio(request, event));
		return;
	}

	// Images — full GET only; ignore range (not used for drawings).
	if (request.headers.get('range')) return;

	event.respondWith(cacheFirst(request));
});

/** Stable cache key — range requests share one full-file entry. */
function cacheKeyFor(request) {
	return new Request(request.url, { method: 'GET' });
}

async function cacheFirst(request) {
	const cache = await caches.open(CACHE);
	const key = cacheKeyFor(request);
	const hit = await cache.match(key);
	if (hit) return hit;

	const response = await fetch(request);
	if (response.ok && response.status === 200) {
		await cache.put(key, response.clone());
	}
	return response;
}

/**
 * Audio — `<audio preload="metadata">` uses Range requests. Serve slices from a
 * cached full file when we have one; otherwise pass through and backfill cache.
 */
async function handleAudio(request, event) {
	const cache = await caches.open(CACHE);
	const key = cacheKeyFor(request);
	const cached = await cache.match(key);

	if (cached) {
		if (request.headers.get('range')) {
			return serveRangeFromCached(cached, request);
		}
		return cached;
	}

	if (request.headers.get('range')) {
		const response = await fetch(request);
		// Populate cache in the background so revisits skip the network.
		event.waitUntil(
			fetch(key).then(async (full) => {
				if (full.ok && full.status === 200) await cache.put(key, full.clone());
			})
		);
		return response;
	}

	const response = await fetch(request);
	if (response.ok && response.status === 200) {
		await cache.put(key, response.clone());
	}
	return response;
}

/**
 * Serve a Range response from a cached full file without copying the whole
 * recording into JS heap — Blob.slice streams from cache storage (same approach
 * as Workbox range-requests).
 */
async function serveRangeFromCached(cachedResponse, request) {
	const range = request.headers.get('range');
	if (!range) return cachedResponse;

	const match = /bytes=(\d+)-(\d*)/.exec(range);
	if (!match) return cachedResponse;

	const blob = await cachedResponse.blob();
	const size = blob.size;
	const start = Number.parseInt(match[1], 10);
	const end = match[2] ? Number.parseInt(match[2], 10) : size - 1;
	if (start >= size || end >= size || start > end) {
		return new Response(null, { status: 416, statusText: 'Range Not Satisfiable' });
	}

	const slice = blob.slice(start, end + 1);
	const headers = new Headers();
	headers.set('Content-Length', String(slice.size));
	headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
	headers.set('Accept-Ranges', 'bytes');
	const type = cachedResponse.headers.get('Content-Type');
	if (type) headers.set('Content-Type', type);

	return new Response(slice, { status: 206, statusText: 'Partial Content', headers });
}

// @ts-nocheck
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeMediaCacheKey, listPrecacheUrls } from './media-cache-key.mjs';

const root = resolve(import.meta.dirname, '..');
const templatePath = resolve(root, 'scripts/sw.template.js');

export function renderServiceWorker(cacheKey, precacheUrls = []) {
	const template = readFileSync(templatePath, 'utf8');
	return template
		.replaceAll('__CACHE_VERSION__', cacheKey)
		.replace('__PRECACHE_URLS__', JSON.stringify(precacheUrls));
}

/** Serve `sw.js` in dev; production build emits via CLI after adapter. */
export function serviceWorkerPlugin() {
	return {
		name: 'service-worker',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const path = req.url?.split('?')[0];
				if (path !== '/sw.js') return next();
				void (async () => {
					const { key } = await computeMediaCacheKey();
					const urls = await listPrecacheUrls(process.env.BASE_PATH ?? '');
					res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
					res.setHeader('Cache-Control', 'no-store');
					res.end(renderServiceWorker(key, urls));
				})().catch(next);
			});
		}
	};
}

export async function emitServiceWorker(outDir = 'build') {
	const { key, fileCount } = await computeMediaCacheKey();
	const precacheUrls = await listPrecacheUrls(process.env.BASE_PATH ?? '');
	const outPath = resolve(root, outDir, 'sw.js');
	writeFileSync(outPath, renderServiceWorker(key, precacheUrls));
	console.log(
		`wrote ${outPath} (cache: unicorn-media-${key}, ${fileCount} media files, ${precacheUrls.length} precache)`
	);
}

/** CLI entry — `node scripts/service-worker.mjs` after `vite build`. */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await emitServiceWorker();
}

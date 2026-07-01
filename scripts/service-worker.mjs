// @ts-nocheck
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { computeMediaCacheKey } from './media-cache-key.mjs';

const root = resolve(import.meta.dirname, '..');
const templatePath = resolve(root, 'scripts/sw.template.js');

export function renderServiceWorker(cacheKey) {
	const template = readFileSync(templatePath, 'utf8');
	return template.replaceAll('__CACHE_VERSION__', cacheKey);
}

/** Serve `sw.js` in dev; production build still emits via `emit-sw.mjs` after adapter. */
export function serviceWorkerPlugin() {
	return {
		name: 'service-worker',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const path = req.url?.split('?')[0];
				if (path !== '/sw.js') return next();
				res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
				res.setHeader('Cache-Control', 'no-store');
				res.end(renderServiceWorker('dev'));
			});
		}
	};
}

export async function emitServiceWorker(outDir = 'build') {
	const { key, fileCount } = await computeMediaCacheKey();
	const outPath = resolve(root, outDir, 'sw.js');
	writeFileSync(outPath, renderServiceWorker(key));
	console.log(`wrote ${outPath} (cache: unicorn-media-${key}, ${fileCount} media files)`);
}

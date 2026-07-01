// @ts-nocheck
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const templatePath = resolve(root, 'scripts/sw.template.js');

export function renderServiceWorker(version) {
	const template = readFileSync(templatePath, 'utf8');
	return template.replaceAll('__CACHE_VERSION__', version);
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

export function emitServiceWorker(outDir = 'build') {
	const versionPath = resolve(root, outDir, '_app/version.json');
	let version = Date.now().toString(36);
	if (existsSync(versionPath)) {
		version = JSON.parse(readFileSync(versionPath, 'utf8')).version;
	}
	const outPath = resolve(root, outDir, 'sw.js');
	writeFileSync(outPath, renderServiceWorker(version));
	console.log(`wrote ${outPath} (cache: unicorn-media-${version})`);
}

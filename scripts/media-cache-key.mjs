// @ts-nocheck
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

/** Paths served under SW media routes — keep in sync with `scripts/sw.template.js`. */
const MEDIA_DIRS = ['static/drawings', 'static/audio', 'static/hall'];

const MEDIA_EXT = new Set(['.jpg', '.jpeg', '.webp', '.png', '.m4a', '.webm', '.ogg']);

async function walkMediaFiles(dir) {
	const abs = resolve(root, dir);
	const out = [];
	const entries = await readdir(abs, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue;
		const path = join(abs, entry.name);
		if (entry.isDirectory()) {
			out.push(...(await walkMediaFiles(relative(root, path))));
			continue;
		}
		if (!entry.isFile()) continue;
		const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase();
		if (!MEDIA_EXT.has(ext)) continue;
		out.push(relative(root, path).split('\\').join('/'));
	}
	return out;
}

function hashFile(path) {
	return new Promise((resolve, reject) => {
		const hash = createHash('sha256');
		createReadStream(path)
			.on('data', (chunk) => hash.update(chunk))
			.on('end', () => resolve(hash.digest('hex')))
			.on('error', reject);
	});
}

/**
 * Stable cache key from on-disk media bytes. Code/CSS deploys reuse the same key
 * until a file under drawings/, audio/, or hall/ changes.
 */
export async function computeMediaCacheKey() {
	const paths = (await Promise.all(MEDIA_DIRS.map(walkMediaFiles))).flat().sort();
	const manifest = createHash('sha256');

	for (const rel of paths) {
		const digest = await hashFile(resolve(root, rel));
		manifest.update(`${rel}\0${digest}\n`);
	}

	return { key: manifest.digest('hex').slice(0, 16), fileCount: paths.length };
}

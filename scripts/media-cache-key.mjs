// @ts-nocheck
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { loadDrawingFiles, thumbPublicUrl } from './content-drawings.mjs';

const root = resolve(import.meta.dirname, '..');

/** Paths served under SW media routes — keep in sync with `scripts/sw.template.js`. */
const MEDIA_DIRS = ['static/drawings', 'static/audio', 'static/hall', 'static/atelier'];

const MEDIA_EXT = new Set(['.jpg', '.jpeg', '.webp', '.m4a', '.webm']);

async function walkMediaFiles(dir) {
	const abs = resolve(root, dir);
	let entries;
	try {
		entries = await readdir(abs, { withFileTypes: true });
	} catch {
		return [];
	}
	const out = [];
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

async function listMediaPaths() {
	return (await Promise.all(MEDIA_DIRS.map(walkMediaFiles))).flat().sort();
}

function toPublicUrl(relPath, basePath = '') {
	const base = basePath.replace(/\/$/, '');
	return `${base}/${relPath.replace(/^static\//, '')}`;
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
 * until a file under drawings/, audio/, hall/, or atelier/ changes.
 */
export async function computeMediaCacheKey() {
	const paths = await listMediaPaths();
	const manifest = createHash('sha256');

	for (const rel of paths) {
		const digest = await hashFile(resolve(root, rel));
		manifest.update(`${rel}\0${digest}\n`);
	}

	return { key: manifest.digest('hex').slice(0, 16), fileCount: paths.length };
}

/** URL paths to warm on SW install — hall + atelier webp + gallery thumbs (not full JPEGs or audio). */
export async function listPrecacheUrls(basePath = '') {
	const hall = (await walkMediaFiles('static/hall'))
		.filter((rel) => rel.endsWith('.webp'))
		.map((rel) => toPublicUrl(rel, basePath));
	const atelier = (await walkMediaFiles('static/atelier'))
		.filter((rel) => rel.endsWith('.webp'))
		.map((rel) => toPublicUrl(rel, basePath));
	const thumbs = loadDrawingFiles().map((file) => thumbPublicUrl(file, basePath));
	return [...hall, ...atelier, ...thumbs].sort();
}

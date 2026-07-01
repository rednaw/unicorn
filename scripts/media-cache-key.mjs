// @ts-nocheck
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const CONTENT_TS = join(root, 'src/lib/content.ts');

/** Paths served under SW media routes — keep in sync with `scripts/sw.template.js`. */
const MEDIA_DIRS = ['static/drawings', 'static/audio', 'static/hall'];

const MEDIA_EXT = new Set(['.jpg', '.jpeg', '.webp', '.png', '.m4a', '.webm', '.ogg']);

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

/** Gallery thumb URLs from content.ts — matches what the atelier renders. */
function thumbUrlsFromContent(basePath = '') {
	const source = readFileSync(CONTENT_TS, 'utf8');
	const re = /\.\.\.drawingPaths\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g;
	const urls = [];
	let m;
	while ((m = re.exec(source)) !== null) {
		const baseName = m[2].replace(/\.[^.]+$/, '');
		urls.push(toPublicUrl(`static/drawings/${baseName}-thumb.webp`, basePath));
	}
	return urls;
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
	const paths = await listMediaPaths();
	const manifest = createHash('sha256');

	for (const rel of paths) {
		const digest = await hashFile(resolve(root, rel));
		manifest.update(`${rel}\0${digest}\n`);
	}

	return { key: manifest.digest('hex').slice(0, 16), fileCount: paths.length };
}

/** URL paths to warm on SW install — hall webp + gallery thumbs (not full JPEGs or audio). */
export async function listPrecacheUrls(basePath = '') {
	const hall = (await walkMediaFiles('static/hall'))
		.filter((rel) => rel.endsWith('.webp'))
		.map((rel) => toPublicUrl(rel, basePath));
	return [...hall, ...thumbUrlsFromContent(basePath)].sort();
}

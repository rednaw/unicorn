#!/usr/bin/env node
/**
 * Generate gallery/atelier placeholder thumbs from original JPEGs.
 * Reads source filenames from src/lib/content.ts (drawingPaths lines).
 *
 * image001.jpg → image001-thumb.webp  (640 px long edge, WebP)
 *
 * Usage: pnpm assets:thumbs
 *        DRAWINGS_DIR=./static/drawings pnpm assets:thumbs
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DRAWINGS_DIR = process.env.DRAWINGS_DIR ?? join(root, 'static/drawings');
const CONTENT_TS = join(root, 'src/lib/content.ts');
const THUMB_LONG_EDGE = 640;
const THUMB_QUALITY = 80;

function loadSourceFiles() {
	const source = readFileSync(CONTENT_TS, 'utf8');
	const re = /\.\.\.drawingPaths\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g;
	const files = [];
	let m;
	while ((m = re.exec(source)) !== null) {
		files.push({ id: m[1], file: m[2] });
	}
	if (files.length === 0) {
		throw new Error(`No drawingPaths(...) entries found in ${CONTENT_TS}`);
	}
	return files;
}

function thumbName(file) {
	const base = file.replace(/\.[^.]+$/, '');
	return `${base}-thumb.webp`;
}

function kb(path) {
	return Math.round(statSync(path).size / 1024);
}

async function makeThumb(inputPath, outputPath) {
	await sharp(inputPath)
		.rotate()
		.resize(THUMB_LONG_EDGE, THUMB_LONG_EDGE, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality: THUMB_QUALITY, effort: 4 })
		.toFile(outputPath);
}

async function main() {
	if (!existsSync(DRAWINGS_DIR)) {
		throw new Error(`Drawings directory not found: ${DRAWINGS_DIR}`);
	}

	const sources = loadSourceFiles();
	let ok = 0;

	for (const { id, file } of sources) {
		const input = join(DRAWINGS_DIR, file);
		const output = join(DRAWINGS_DIR, thumbName(file));

		if (!existsSync(input)) {
			console.warn(`skip ${id}: missing ${input}`);
			continue;
		}

		await makeThumb(input, output);
		console.log(`✓ ${thumbName(file)}  ←  ${file}  (${kb(output)} KB)`);
		ok++;
	}

	if (ok === 0) {
		throw new Error('No thumbs generated — are originals in static/drawings/?');
	}

	console.log(`\n${ok} thumb(s) → ${DRAWINGS_DIR}`);
}

main().catch((err) => {
	console.error(err.message ?? err);
	process.exit(1);
});

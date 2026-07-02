#!/usr/bin/env node
/**
 * Build-time WebP thumbs from drawing JPEG masters in static/drawings/.
 * Outputs are gitignored; CI and local build run this before `vite build`.
 */

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { kb, needsEncode } from './build-utils.mjs';
import { loadDrawingFiles, thumbFileName } from './content-drawings.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DRAWINGS_DIR = process.env.DRAWINGS_DIR ?? join(root, 'static/drawings');
const THUMB_LONG_EDGE = 960;
const THUMB_QUALITY = 80;

async function makeThumb(inputPath, outputPath) {
	await sharp(inputPath)
		.rotate()
		.resize(THUMB_LONG_EDGE, THUMB_LONG_EDGE, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality: THUMB_QUALITY, effort: 4 })
		.toFile(outputPath);
}

async function main() {
	if (!existsSync(DRAWINGS_DIR)) {
		console.log('encode-thumbs: static/drawings/ missing (skip)');
		return;
	}

	const sources = loadDrawingFiles();
	let encoded = 0;
	let skipped = 0;
	let missing = 0;

	for (const file of sources) {
		const input = join(DRAWINGS_DIR, file);
		const output = join(DRAWINGS_DIR, thumbFileName(file));

		if (!existsSync(input)) {
			console.warn(`skip ${file}: missing ${input}`);
			missing++;
			continue;
		}

		if (!needsEncode(input, output)) {
			skipped++;
			continue;
		}

		await makeThumb(input, output);
		console.log(`✓ ${thumbFileName(file)}  ←  ${file}  (${kb(output)} KB)`);
		encoded++;
	}

	if (encoded === 0 && skipped > 0) {
		console.log(`encode-thumbs: ${skipped} thumb(s) up to date`);
	} else if (encoded > 0) {
		console.log(`\n${encoded} thumb(s) → ${DRAWINGS_DIR}`);
	} else if (missing === sources.length) {
		console.warn('encode-thumbs: no jpg found — pull LFS or add originals');
	}
}

try {
	await main();
} catch (err) {
	console.error(err.message ?? err);
	process.exit(1);
}

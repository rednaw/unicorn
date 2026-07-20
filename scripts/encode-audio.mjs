#!/usr/bin/env node
/**
 * Build-time Opus/WebM siblings for m4a masters in static/audio/ and static/atelier/.
 * Outputs are gitignored; CI and local build run this before `vite build`.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kb, needsEncode } from './build-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/** @typedef {{ dir: string; opusBitrate: string; label: string }} AudioEncodeTarget */

/** @type {AudioEncodeTarget[]} */
const TARGETS = [
	{
		dir: process.env.AUDIO_DIR ?? join(root, 'static/audio'),
		opusBitrate: process.env.AUDIO_OPUS_BITRATE ?? '128k',
		label: 'audio'
	},
	{
		dir: process.env.ATELIER_AUDIO_DIR ?? join(root, 'static/atelier'),
		opusBitrate: process.env.ATELIER_OPUS_BITRATE ?? '48k',
		label: 'atelier'
	}
];

function ensureFfmpeg() {
	const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
	if (result.error || result.status !== 0) {
		throw new Error('ffmpeg not found — use the dev container or install ffmpeg locally');
	}
}

function listM4aFiles(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((name) => name.toLowerCase().endsWith('.m4a'))
		.sort();
}

function encodeOne(inputPath, outputPath, opusBitrate) {
	const result = spawnSync(
		'ffmpeg',
		[
			'-hide_banner',
			'-loglevel',
			'error',
			'-y',
			'-i',
			inputPath,
			'-c:a',
			'libopus',
			'-b:a',
			opusBitrate,
			'-vbr',
			'on',
			'-application',
			'audio',
			outputPath
		],
		{ stdio: 'inherit' }
	);
	if (result.status !== 0) {
		throw new Error(`ffmpeg failed for ${inputPath}`);
	}
}

function encodeDir({ dir, opusBitrate, label }) {
	const sources = listM4aFiles(dir);
	if (sources.length === 0) {
		console.log(`encode-audio: no m4a in ${label}/ (skip)`);
		return { encoded: 0, skipped: 0 };
	}

	let encoded = 0;
	let skipped = 0;

	for (const file of sources) {
		const input = join(dir, file);
		const output = join(dir, file.replace(/\.m4a$/i, '.webm'));

		if (!needsEncode(input, output)) {
			skipped++;
			continue;
		}

		encodeOne(input, output, opusBitrate);
		console.log(`✓ ${label}/${file.replace(/\.m4a$/i, '.webm')}  ←  ${file}  (${kb(output)} KB)`);
		encoded++;
	}

	return { encoded, skipped };
}

function main() {
	ensureFfmpeg();

	let encoded = 0;
	let skipped = 0;

	for (const target of TARGETS) {
		const result = encodeDir(target);
		encoded += result.encoded;
		skipped += result.skipped;
	}

	if (encoded === 0 && skipped > 0) {
		console.log(`encode-audio: ${skipped} webm up to date`);
	} else if (encoded > 0) {
		console.log(`\n${encoded} webm encoded`);
	}
}

try {
	main();
} catch (err) {
	console.error(err.message ?? err);
	process.exit(1);
}

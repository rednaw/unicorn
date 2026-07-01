#!/usr/bin/env node
/**
 * Build-time Opus/WebM siblings for Voice Memo m4a masters in static/audio/.
 * Outputs are gitignored; CI and local build run this before `vite build`.
 *
 * Usage: pnpm assets:audio
 *        AUDIO_OPUS_BITRATE=96k pnpm assets:audio
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const AUDIO_DIR = process.env.AUDIO_DIR ?? join(root, 'static/audio');
const OPUS_BITRATE = process.env.AUDIO_OPUS_BITRATE ?? '128k';

function ensureFfmpeg() {
	const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
	if (result.error || result.status !== 0) {
		throw new Error('ffmpeg not found — use the dev container or install ffmpeg locally');
	}
}

function listM4aFiles() {
	if (!existsSync(AUDIO_DIR)) return [];
	return readdirSync(AUDIO_DIR)
		.filter((name) => name.toLowerCase().endsWith('.m4a'))
		.sort();
}

function needsEncode(m4aPath, webmPath) {
	if (!existsSync(webmPath)) return true;
	return statSync(m4aPath).mtimeMs > statSync(webmPath).mtimeMs;
}

function kb(path) {
	return Math.round(statSync(path).size / 1024);
}

function encodeOne(inputPath, outputPath) {
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
			OPUS_BITRATE,
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

function main() {
	const sources = listM4aFiles();
	if (sources.length === 0) {
		console.log('encode-audio: no m4a in static/audio/ (skip)');
		return;
	}

	ensureFfmpeg();

	let encoded = 0;
	let skipped = 0;

	for (const file of sources) {
		const input = join(AUDIO_DIR, file);
		const output = join(AUDIO_DIR, file.replace(/\.m4a$/i, '.webm'));

		if (!needsEncode(input, output)) {
			skipped++;
			continue;
		}

		encodeOne(input, output);
		console.log(`✓ ${file.replace(/\.m4a$/i, '.webm')}  ←  ${file}  (${kb(output)} KB)`);
		encoded++;
	}

	if (encoded === 0 && skipped > 0) {
		console.log(`encode-audio: ${skipped} webm up to date`);
	} else if (encoded > 0) {
		console.log(`\n${encoded} webm → ${AUDIO_DIR}`);
	}
}

try {
	main();
} catch (err) {
	console.error(err.message ?? err);
	process.exit(1);
}

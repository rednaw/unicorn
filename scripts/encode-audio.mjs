#!/usr/bin/env node
/**
 * Build-time audio derivatives.
 * - Performances: vinyl mix (needle drop + track + lift) → `.vinyl.m4a` + `.vinyl.webm`
 * - Atelier needle masters: Opus/WebM siblings
 * Outputs are gitignored; CI and local build run this before `vite build`.
 *
 * Mix: drop at dropVol, lift at liftVol, music overlap/fade as below.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { kb, needsEncode } from './build-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const AUDIO_DIR = process.env.AUDIO_DIR ?? join(root, 'static/audio');
const ATELIER_DIR = process.env.ATELIER_AUDIO_DIR ?? join(root, 'static/atelier');
const OPUS_BITRATE = process.env.AUDIO_OPUS_BITRATE ?? '128k';
const ATELIER_OPUS_BITRATE = process.env.ATELIER_OPUS_BITRATE ?? '48k';
const AAC_BITRATE = process.env.AUDIO_AAC_BITRATE ?? '128k';

const NEEDLE_DROP = join(ATELIER_DIR, 'needle-drop.m4a');
const NEEDLE_LIFT = join(ATELIER_DIR, 'needle-lift.m4a');

/** @type {{ overlapSec: number; fadeInSec: number; dropVol: number; liftVol: number }} */
const VINYL = {
	overlapSec: 2,
	fadeInSec: 0.3,
	dropVol: 0.15,
	liftVol: 0.3
};

function ensureFfmpeg() {
	const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
	if (result.error || result.status !== 0) {
		throw new Error('ffmpeg not found — use the dev container or install ffmpeg locally');
	}
}

function listM4aMasters(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((name) => name.toLowerCase().endsWith('.m4a') && !name.toLowerCase().endsWith('.vinyl.m4a'))
		.sort();
}

function probeDurationSec(inputPath) {
	const result = spawnSync(
		'ffprobe',
		['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', inputPath],
		{ encoding: 'utf8' }
	);
	if (result.error || result.status !== 0) {
		throw new Error(`ffprobe failed for ${inputPath}: ${result.stderr || result.error?.message}`);
	}
	const sec = Number.parseFloat(result.stdout.trim());
	if (!Number.isFinite(sec) || sec <= 0) {
		throw new Error(`ffprobe returned no duration for ${inputPath}`);
	}
	return sec;
}

function runFfmpeg(args) {
	const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
		stdio: 'inherit'
	});
	if (result.status !== 0) {
		throw new Error(`ffmpeg failed: ${args.join(' ')}`);
	}
}

function newestMtime(paths) {
	return Math.max(...paths.map((p) => statSync(p).mtimeMs));
}

function needsVinyl(inputs, outputs) {
	if (outputs.some((p) => !existsSync(p))) return true;
	const oldestOut = Math.min(...outputs.map((p) => statSync(p).mtimeMs));
	return newestMtime(inputs) > oldestOut;
}

function encodeOpus(inputPath, outputPath, opusBitrate) {
	runFfmpeg(['-i', inputPath, '-c:a', 'libopus', '-b:a', opusBitrate, '-vbr', 'on', '-application', 'audio', outputPath]);
}

function mixVinyl(musicPath, wavPath) {
	const dropDur = probeDurationSec(NEEDLE_DROP);
	const musicDur = probeDurationSec(musicPath);
	const overlap = Math.min(VINYL.overlapSec, dropDur, musicDur);
	const fadeOutStart = Math.max(0, musicDur - overlap);
	const musicDelayMs = Math.round(Math.max(0, dropDur - overlap) * 1000);
	const liftDelayMs = Math.round(musicDelayMs + Math.max(0, musicDur - overlap) * 1000);
	const fmt = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
	const delay = (ms) => (ms > 0 ? `,adelay=${ms}|${ms}:all=1` : '');
	const filter = [
		`[0:a]${fmt},volume=${VINYL.dropVol}[d]`,
		`[1:a]${fmt},afade=t=in:st=0:d=${VINYL.fadeInSec},afade=t=out:st=${fadeOutStart}:d=${overlap}${delay(musicDelayMs)}[m]`,
		`[2:a]${fmt},volume=${VINYL.liftVol}${delay(liftDelayMs)}[l]`,
		`[d][m][l]amix=inputs=3:duration=longest:dropout_transition=0:normalize=0[a]`
	].join(';');

	runFfmpeg([
		'-i',
		NEEDLE_DROP,
		'-i',
		musicPath,
		'-i',
		NEEDLE_LIFT,
		'-filter_complex',
		filter,
		'-map',
		'[a]',
		'-c:a',
		'pcm_s16le',
		wavPath
	]);
}

function encodeVinylAac(wavPath, outputPath) {
	runFfmpeg([
		'-i',
		wavPath,
		'-c:a',
		'aac',
		'-b:a',
		AAC_BITRATE,
		'-movflags',
		'+faststart',
		outputPath
	]);
}

function encodePerformances() {
	if (!existsSync(NEEDLE_DROP) || !existsSync(NEEDLE_LIFT)) {
		throw new Error('needle-drop.m4a / needle-lift.m4a missing under static/atelier/');
	}

	const sources = listM4aMasters(AUDIO_DIR);
	if (sources.length === 0) {
		console.log('encode-audio: no m4a performances (skip vinyl)');
		return { encoded: 0, skipped: 0 };
	}

	let encoded = 0;
	let skipped = 0;

	for (const file of sources) {
		const input = join(AUDIO_DIR, file);
		const vinylM4a = join(AUDIO_DIR, file.replace(/\.m4a$/i, '.vinyl.m4a'));
		const vinylWebm = join(AUDIO_DIR, file.replace(/\.m4a$/i, '.vinyl.webm'));
		const inputs = [input, NEEDLE_DROP, NEEDLE_LIFT];

		if (!needsVinyl(inputs, [vinylM4a, vinylWebm])) {
			skipped++;
			continue;
		}

		const wavPath = join(tmpdir(), `unicorn-vinyl-${file.replace(/[^\w.-]+/g, '_')}.wav`);
		try {
			mixVinyl(input, wavPath);
			encodeVinylAac(wavPath, vinylM4a);
			encodeOpus(wavPath, vinylWebm, OPUS_BITRATE);
		} finally {
			try {
				unlinkSync(wavPath);
			} catch {}
		}

		console.log(
			`✓ audio/${file.replace(/\.m4a$/i, '.vinyl.m4a')} + .webm  ←  ${file}  (${kb(vinylM4a)} + ${kb(vinylWebm)} KB)`
		);
		encoded++;
	}

	return { encoded, skipped };
}

function encodeAtelierNeedles() {
	const sources = listM4aMasters(ATELIER_DIR);
	if (sources.length === 0) {
		console.log('encode-audio: no m4a in atelier/ (skip)');
		return { encoded: 0, skipped: 0 };
	}

	let encoded = 0;
	let skipped = 0;

	for (const file of sources) {
		const input = join(ATELIER_DIR, file);
		const output = join(ATELIER_DIR, file.replace(/\.m4a$/i, '.webm'));
		if (!needsEncode(input, output)) {
			skipped++;
			continue;
		}
		encodeOpus(input, output, ATELIER_OPUS_BITRATE);
		console.log(`✓ atelier/${file.replace(/\.m4a$/i, '.webm')}  ←  ${file}  (${kb(output)} KB)`);
		encoded++;
	}

	return { encoded, skipped };
}

function main() {
	ensureFfmpeg();

	const vinyl = encodePerformances();
	const atelier = encodeAtelierNeedles();
	const encoded = vinyl.encoded + atelier.encoded;
	const skipped = vinyl.skipped + atelier.skipped;

	if (encoded === 0 && skipped > 0) {
		console.log(`encode-audio: ${skipped} derivatives up to date`);
	} else if (encoded > 0) {
		console.log(`\n${encoded} audio derivatives encoded`);
	}
}

try {
	main();
} catch (err) {
	console.error(err.message ?? err);
	process.exit(1);
}

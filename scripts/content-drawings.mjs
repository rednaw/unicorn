// @ts-nocheck
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const CONTENT_TS = join(root, 'src/lib/content.ts');

const DRAWING_PATHS_RE = /\.\.\.drawingPaths\(\s*'([^']+)'\s*\)/g;

/** JPEG filenames from `drawingPaths('…')` lines in content.ts. */
export function loadDrawingFiles(contentPath = CONTENT_TS) {
	const source = readFileSync(contentPath, 'utf8');
	const files = [];
	let m;
	while ((m = DRAWING_PATHS_RE.exec(source)) !== null) {
		files.push(m[1]);
	}
	if (files.length === 0) {
		throw new Error(`No drawingPaths(...) entries found in ${contentPath}`);
	}
	return files;
}

export function thumbFileName(jpegFile) {
	const base = jpegFile.replace(/\.[^.]+$/, '');
	return `${base}-thumb.webp`;
}

export function thumbPublicUrl(jpegFile, basePath = '') {
	const base = basePath.replace(/\/$/, '');
	return `${base}/drawings/${thumbFileName(jpegFile)}`;
}

import { existsSync, statSync } from 'node:fs';

/** Re-encode when the derivative is missing or older than the master. */
export function needsEncode(masterPath, derivativePath) {
	if (!existsSync(derivativePath)) return true;
	return statSync(masterPath).mtimeMs > statSync(derivativePath).mtimeMs;
}

export function kb(path) {
	return Math.round(statSync(path).size / 1024);
}

import { vi } from 'vitest';

/** Async rAF via setTimeout — avoids sync rAF stack overflow in animation tests. */
export function installRafViaTimers() {
	vi.stubGlobal(
		'requestAnimationFrame',
		vi.fn((cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number)
	);
	vi.stubGlobal(
		'cancelAnimationFrame',
		vi.fn((id: number) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>))
	);
}

export async function flushRaf() {
	await Promise.resolve();
	await Promise.resolve();
}

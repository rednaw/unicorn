import { afterEach, vi } from 'vitest';
import { installAudioMocks } from './mock-audio';

export const audioMocks = installAudioMocks();

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
});

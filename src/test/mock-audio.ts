import { vi } from 'vitest';

export const HAVE_METADATA = 1;

export class MockGainParam {
	value = 0;
	cancelScheduledValues = vi.fn();
	setValueAtTime = vi.fn((v: number) => {
		this.value = v;
	});
	linearRampToValueAtTime = vi.fn((v: number) => {
		this.value = v;
	});
}

export class MockGainNode {
	gain = new MockGainParam();
	connect = vi.fn().mockReturnThis();
}

export class MockMediaElementSource {
	connect = vi.fn().mockReturnThis();
}

export class MockStereoPanner {
	connect = vi.fn().mockReturnThis();
}

export class MockAudio extends EventTarget {
	private _src = '';
	paused = true;
	ended = false;
	currentTime = 0;
	preload = 'metadata';
	readyState = 0;
	loop = false;

	get src() {
		return this._src;
	}

	set src(value: string) {
		this._src = value;
		this.readyState = HAVE_METADATA;
		queueMicrotask(() => this.dispatchEvent(new Event('loadedmetadata')));
	}

	pause() {
		this.paused = true;
	}

	load() {}

	removeAttribute(name: string) {
		if (name === 'src') {
			this._src = '';
			this.readyState = 0;
		}
	}

	play() {
		this.paused = false;
		this.ended = false;
		return Promise.resolve();
	}
}

export class MockAudioContext {
	currentTime = 0;
	state: AudioContextState = 'running';
	destination = {};

	resume = vi.fn().mockResolvedValue(undefined);

	createGain() {
		return new MockGainNode();
	}

	createMediaElementSource() {
		return new MockMediaElementSource();
	}

	createStereoPanner() {
		return new MockStereoPanner();
	}

	createBuffer() {
		return {};
	}

	createBufferSource() {
		return {
			buffer: null as AudioBuffer | null,
			connect: vi.fn(),
			start: vi.fn()
		};
	}
}

export function installAudioMocks() {
	const instances: MockAudio[] = [];

	const AudioCtor = vi.fn(function Audio(this: MockAudio) {
		const el = new MockAudio();
		instances.push(el);
		return el;
	});

	vi.stubGlobal('Audio', AudioCtor);
	vi.stubGlobal('AudioContext', MockAudioContext);
	vi.stubGlobal('webkitAudioContext', MockAudioContext);

	return {
		instances,
		lastAudio: () => instances.at(-1)
	};
}

export async function flushMicrotasks() {
	await Promise.resolve();
	await Promise.resolve();
}

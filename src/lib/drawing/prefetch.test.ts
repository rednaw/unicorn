import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushMicrotasks } from '../../test/mock-audio';
import { mockDrawing } from '../../test/fixtures';
import {
	fullReadyIds,
	prefetchVisibleInView,
	requestDrawing,
	resetPrefetchForTests,
	warmAllDrawingThumbs
} from './prefetch.svelte';
import { drawingListenPoint } from '$lib/atelier/drawing-geometry';
import { centreOnCanvas } from '$lib/atelier/view-math';

type MockImage = {
	src: string;
	fetchPriority: string;
	decoding: string;
	decode: ReturnType<typeof vi.fn>;
	onload: (() => void) | null;
	onerror: (() => void) | null;
};

const imageInstances: MockImage[] = [];
let decodeResolvers: Array<() => void> = [];

function installImageMock() {
	imageInstances.length = 0;
	decodeResolvers = [];

	class ImageMock {
		src = '';
		fetchPriority = '';
		decoding = '';
		onload: (() => void) | null = null;
		onerror: (() => void) | null = null;
		decode = vi.fn(() => {
			return new Promise<void>((resolve) => {
				decodeResolvers.push(resolve);
			});
		});

		constructor() {
			imageInstances.push(this);
		}
	}

	vi.stubGlobal('Image', ImageMock);
}

async function flushDecode(n = 1) {
	for (let i = 0; i < n; i++) {
		decodeResolvers.shift()?.();
		await flushMicrotasks();
	}
}

describe('prefetch', () => {
	beforeEach(() => {
		installImageMock();
		resetPrefetchForTests();
	});

	afterEach(() => {
		resetPrefetchForTests();
		vi.unstubAllGlobals();
	});

	it('ignores requestDrawing for ids not in the passed catalog', () => {
		const catalog = [mockDrawing({ id: 'a', thumb: '/a-thumb.webp', src: '/a.jpg' })];
		requestDrawing(catalog, 'missing', 'thumb');
		expect(imageInstances).toHaveLength(0);
	});

	it('warms each thumb once per URL', () => {
		const catalog = [
			mockDrawing({ id: 'a', thumb: '/shared-thumb.webp', src: '/a.jpg' }),
			mockDrawing({ id: 'b', thumb: '/shared-thumb.webp', src: '/b.jpg' })
		];
		warmAllDrawingThumbs(catalog);
		requestDrawing(catalog, 'a', 'thumb');
		requestDrawing(catalog, 'b', 'thumb');
		expect(imageInstances).toHaveLength(1);
		expect(imageInstances[0]!.src).toBe('/shared-thumb.webp');
	});

	it('marks a drawing full-ready after decode completes', async () => {
		const catalog = [mockDrawing({ id: 'a', src: '/a.jpg', thumb: '/a-thumb.webp' })];
		requestDrawing(catalog, 'a', 'full');
		expect(fullReadyIds().has('a')).toBe(false);

		await flushDecode();
		expect(fullReadyIds().has('a')).toBe(true);
	});

	it('serializes full-res decode jobs', async () => {
		const catalog = [
			mockDrawing({ id: 'a', src: '/a.jpg', thumb: '/a-thumb.webp' }),
			mockDrawing({ id: 'b', src: '/b.jpg', thumb: '/b-thumb.webp' })
		];
		requestDrawing(catalog, 'a', 'full');
		requestDrawing(catalog, 'b', 'full');

		expect(imageInstances).toHaveLength(1);
		await flushDecode();
		expect(fullReadyIds().has('a')).toBe(true);
		expect(fullReadyIds().has('b')).toBe(false);

		await flushDecode();
		expect(fullReadyIds().has('b')).toBe(true);
	});

	it('prefetchVisibleInView only considers drawings in the passed catalog', async () => {
		const inCatalog = mockDrawing({
			id: 'visible',
			landscape: { x: 100, y: 100 },
			width: 400,
			rotation: 0,
			src: '/visible.jpg',
			thumb: '/visible-thumb.webp'
		});
		const hidden = mockDrawing({
			id: 'hidden',
			landscape: { x: 5000, y: 5000 },
			width: 400,
			src: '/hidden.jpg',
			thumb: '/hidden-thumb.webp'
		});
		const viewport = { width: 390, height: 844 };
		const focus = centreOnCanvas(
			viewport,
			drawingListenPoint(inCatalog, inCatalog.landscape).x,
			drawingListenPoint(inCatalog, inCatalog.landscape).y,
			2.5
		);

		prefetchVisibleInView([inCatalog], focus, viewport, 'landscape', (d) => d.landscape);
		await flushDecode();

		expect(fullReadyIds().has('visible')).toBe(true);
		expect(fullReadyIds().has('hidden')).toBe(false);
	});
});

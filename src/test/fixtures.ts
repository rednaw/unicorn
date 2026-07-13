import type { Drawing, DrawingTrack } from '$lib/content-types';

export function mockTrack(overrides: Partial<DrawingTrack> & { id: string }): DrawingTrack {
	return {
		title: 'Test piece',
		composer: 'Test Composer',
		src: '/audio/test.m4a',
		...overrides
	};
}

export function mockDrawing(overrides: Partial<Drawing> & Pick<Drawing, 'id'>): Drawing {
	return {
		title: overrides.id,
		year: '2023',
		medium: 'potlood op papier',
		src: '/drawings/test.jpg',
		thumb: '/drawings/test-thumb.webp',
		srcWidth: 3000,
		srcHeight: 4000,
		portrait: { x: 0, y: 0 },
		landscape: { x: 0, y: 0 },
		width: 300,
		...overrides
	};
}

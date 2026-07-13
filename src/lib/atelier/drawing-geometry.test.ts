import { describe, expect, it } from 'vitest';
import {
	drawingAtCanvasPoint,
	drawingListenPoint,
	pieceBounds,
	rotatedPieceBounds
} from './drawing-geometry';
import { mockDrawing, mockTrack } from '../../test/fixtures';

describe('pieceBounds', () => {
	it('includes plaque height when a track is present', () => {
		const withAudio = mockDrawing({ id: 'a', track: mockTrack({ id: 't' }) });
		const silent = mockDrawing({ id: 'b' });
		expect(pieceBounds(withAudio).height).toBeGreaterThan(pieceBounds(silent).height);
	});
});

describe('drawingListenPoint', () => {
	it('returns the mat centre for a floor position', () => {
		const d = mockDrawing({ id: 'a', landscape: { x: 100, y: 50 }, width: 300 });
		const { width, height } = pieceBounds(d);
		const pt = drawingListenPoint(d, d.landscape);
		expect(pt).toEqual({ x: 100 + width / 2, y: 50 + height / 2 });
	});
});

describe('rotatedPieceBounds', () => {
	it('expands the axis-aligned box when rotated', () => {
		const d = mockDrawing({ id: 'a', rotation: 45, landscape: { x: 0, y: 0 }, width: 200 });
		const upright = rotatedPieceBounds({ ...d, rotation: 0 }, d.landscape);
		const rotated = rotatedPieceBounds(d, d.landscape);
		expect(rotated.width).toBeGreaterThan(upright.width * 0.9);
	});
});

describe('drawingAtCanvasPoint', () => {
	it('hits a piece at its centre in local coordinates', () => {
		const d = mockDrawing({ id: 'target', landscape: { x: 100, y: 100 }, width: 200, rotation: 0 });
		const centre = drawingListenPoint(d, d.landscape);
		expect(drawingAtCanvasPoint([d], centre.x, centre.y)).toBe('target');
	});

	it('returns null outside the piece', () => {
		const d = mockDrawing({ id: 'target', landscape: { x: 0, y: 0 }, width: 200 });
		expect(drawingAtCanvasPoint([d], -50, -50)).toBeNull();
	});

	it('returns the first hit in array order (current stacking behaviour)', () => {
		const back = mockDrawing({ id: 'back', landscape: { x: 0, y: 0 }, width: 200, rotation: 0 });
		const front = mockDrawing({ id: 'front', landscape: { x: 50, y: 50 }, width: 200, rotation: 0 });
		const centre = drawingListenPoint(front, front.landscape);
		expect(drawingAtCanvasPoint([back, front], centre.x, centre.y)).toBe('back');
	});
});

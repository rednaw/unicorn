/** Virtual table size in canvas pixels. */
export const ATELIER_CANVAS = { width: 2200, height: 1400 } as const;

export const ATELIER_ZOOM = {
	initial: 0.7,
	min: 0.25,
	fitPadding: 0.95,
	focusFill: 0.76,
	focusStep: 0.22,
	/** Minimum zoom when jumping to a speaker (`ZOOM_GATE_HIGH + 0.15`). */
	speakerMin: 1.1,
	dblTapFactor: 1.7,
	wheelExp: 0.0018,
	keyboardStep: 1.15,
	keyboardPan: 90
} as const;

export const ATELIER_GESTURES = {
	panThresholdMouse: 6,
	panThresholdTouch: 8,
	panThresholdPiece: 18,
	dblTapWindowMs: 300,
	dblTapSlopPx: 36,
	inertiaMinVelocity: 0.08,
	inertiaStopVelocity: 0.02,
	inertiaDecay: 0.94,
	inertiaStaleMs: 90
} as const;

export const ATELIER_AUDIO = {
	proxRadius: 760,
	zoomGateLow: 0.65,
	zoomGateHigh: 0.95,
	panCap: 0.8,
	nearThreshold: 0.05
} as const;

export const ATELIER_ANIM = {
	viewDurationMs: 380
} as const;

/** Piece slot height / width (mat padding included in layout). */
export const DRAWING_ASPECT = 1.25;
export const DEFAULT_DRAWING_WIDTH = 320;

/** Elements that should not start a canvas pan. */
export const ATELIER_INTERACTIVE_SELECTOR = '.piece, .speaker, .back';

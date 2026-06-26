export const ATELIER_ZOOM = {
	initial: 0.7,
	min: 0.25,
	fitPadding: 0.95,
	focusFill: 0.9,
	focusStep: 0.22,
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
	proxRadius: 460,
	zoomGateLow: 0.65,
	zoomGateHigh: 0.95,
	panCap: 0.8,
	nearThreshold: 0.05,
	/** Gain must reach this before `<audio>` starts — avoids silent playback. */
	playThreshold: 0.08,
	/** `setTargetAtTime` time constant for gain/pan ramps (seconds). */
	rampTimeSec: 0.08
} as const;

export const ATELIER_ANIM = {
	viewDurationMs: 380,
	/** Gallery entry / piece focus — slower so pan/zoom affordance reads clearly. */
	focusDurationMs: 720
} as const;

/** Elements that should not start a canvas pan. */
export const ATELIER_INTERACTIVE_SELECTOR = '.piece, .back';

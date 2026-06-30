export const ATELIER_ZOOM = {
	initial: 0.7,
	min: 0.25,
	fitPadding: 0.95,
	focusFill: 0.9,
	focusStep: 0.22,
	/** Ctrl/meta + wheel, or mouse-wheel notches (LINE mode) — see gestures `onWheel`. */
	wheelExp: 0.0025,
	/** Trackpad pinch (ctrl/meta + DOM_DELTA_PIXEL) — steeper than wheel notches. */
	wheelPinchExp: 0.006,
	keyboardStep: 1.15,
	keyboardPan: 90
} as const;

export const ATELIER_GESTURES = {
	panThresholdMouse: 6,
	panThresholdTouch: 8,
	panThresholdPiece: 18,
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
	/** Keep playing until gain falls below this (hysteresis — stops edge-of-range restarts). */
	pauseThreshold: 0.04,
	/** `setTargetAtTime` time constant for gain/pan ramps (seconds). */
	rampTimeSec: 0.08
} as const;

export const ATELIER_ANIM = {
	viewDurationMs: 380,
	/** Gallery entry / piece focus — slower so pan/zoom affordance reads clearly. */
	focusDurationMs: 720
} as const;

export const ATELIER_PREFETCH = {
	/**
	 * Fraction of the viewport a drawing must cover before its full-res JPEG is fetched.
	 * Coverage (not raw zoom) is the trigger — it means "the visitor is inspecting this piece"
	 * and naturally bounds how many upgrade at once: nothing at overview, one or two as you zoom in.
	 */
	fullResCoverage: 0.18,
	/** Full-res JPEGs are large — one at a time keeps the main thread and network usable on 3G. */
	fullMaxConcurrent: 1
} as const;

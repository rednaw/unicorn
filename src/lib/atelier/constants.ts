export const ATELIER_ZOOM = {
	initial: 0.7,
	min: 0.25,
	/** Portrait pinch-out floor — tall/narrow canvas hits `min` at overview otherwise. */
	minPortrait: 0.13,
	fitPadding: 0.95,
	/** Portrait overview — zoom out a touch more so the desk clears top chrome. */
	fitPaddingPortrait: 0.86,
	/** Room above the leather pad for the back control (px, portrait fit-all only). */
	fitInsetTopPortrait: 56,
	focusFill: 0.9,
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
	/** Gain fade when switching pieces or stopping on back (milliseconds). */
	crossfadeMs: 300,
	/** Vinyl needle SFX under the music graph (linear gain). */
	needleGain: 0.55,
	/**
	 * How long needle SFX and music may share the air at handoff (ms).
	 * Intro: music fades in over the last stretch of the drop.
	 * Outro: lift starts while music fades out over the same window.
	 */
	needleMusicOverlapMs: 400
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
	fullMaxConcurrent: 1,
	/** Debounce before recomputing viewport-based prefetch after pan/zoom. */
	settleMs: 200
} as const;

/** Label width on the mat in CSS px — sync with `DrawingPiece.svelte`. */
export const HMV_PLAQUE_CSS_WIDTH = 44;

/** Sharp plaque WebP (44 × atelierMaxZoom × SHARP_DPR). Source: Wikimedia Commons. */
export const HMV_PLAQUE = {
	cssWidth: HMV_PLAQUE_CSS_WIDTH,
	src: '/atelier/hmv-plaque.webp',
	srcWidth: 502,
	srcHeight: 376
} as const;

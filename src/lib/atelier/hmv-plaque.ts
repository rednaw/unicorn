/** Label width on the mat in CSS px — sync with `DrawingPiece.svelte` (`--hmv-width`). */
export const HMV_PLAQUE_CSS_WIDTH = 44;

/** Plaque WebP. Source: Wikimedia Commons (public domain). */
export const HMV_PLAQUE = {
	cssWidth: HMV_PLAQUE_CSS_WIDTH,
	src: '/atelier/hmv-plaque.webp',
	srcWidth: 502,
	srcHeight: 376
} as const;

/** Set when a piece was focused via viewport pointerup — skips the follow-up button click. */
let suppressButtonClick = false;

export function suppressNextPieceButtonClick() {
	suppressButtonClick = true;
}

export function shouldSuppressPieceButtonClick(): boolean {
	if (!suppressButtonClick) return false;
	suppressButtonClick = false;
	return true;
}

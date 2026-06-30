/** Set when a piece was focused via viewport pointerup — skips the follow-up button click. */
let suppressButtonClick = false;

export function suppressNextPieceButtonClick() {
	suppressButtonClick = true;
	queueMicrotask(() => {
		suppressButtonClick = false;
	});
}

export function shouldSuppressPieceButtonClick(): boolean {
	if (!suppressButtonClick) return false;
	suppressButtonClick = false;
	return true;
}

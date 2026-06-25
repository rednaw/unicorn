export type ViewportMetrics = {
	width: number;
	height: number;
	/** Screen offset — only needed for pointer math; not used for desk fit. */
	left: number;
	top: number;
};

export const EMPTY_VIEWPORT: ViewportMetrics = { width: 0, height: 0, left: 0, top: 0 };

/** Size from ResizeObserver (no extra layout read). Skips initial synchronous read. */
export function observeViewport(
	el: HTMLElement,
	onChange: (metrics: ViewportMetrics) => void
) {
	let raf = 0;

	const ro = new ResizeObserver((entries) => {
		const entry = entries[0];
		if (!entry) return;
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(() => {
			const { width, height } = entry.contentRect;
			onChange({ width, height, left: 0, top: 0 });
		});
	});

	ro.observe(el);

	return () => {
		cancelAnimationFrame(raf);
		ro.disconnect();
	};
}

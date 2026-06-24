export type ViewportMetrics = {
	width: number;
	height: number;
	left: number;
	top: number;
};

export const EMPTY_VIEWPORT: ViewportMetrics = { width: 0, height: 0, left: 0, top: 0 };

export function readViewportMetrics(el: HTMLElement): ViewportMetrics {
	const rect = el.getBoundingClientRect();
	return {
		width: el.clientWidth,
		height: el.clientHeight,
		left: rect.left,
		top: rect.top
	};
}

export function observeViewport(el: HTMLElement, onChange: (metrics: ViewportMetrics) => void) {
	const notify = () => onChange(readViewportMetrics(el));
	notify();
	const ro = new ResizeObserver(notify);
	ro.observe(el);
	return () => ro.disconnect();
}

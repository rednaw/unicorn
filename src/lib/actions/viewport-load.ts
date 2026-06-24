/** Fire once when the node intersects the viewport (optional root + margin). */
export function viewportLoad(
	node: HTMLElement,
	onVisible: () => void
): { destroy: () => void } {
	if (typeof IntersectionObserver === 'undefined') {
		onVisible();
		return { destroy: () => {} };
	}

	const io = new IntersectionObserver(
		(entries) => {
			if (entries.some((e) => e.isIntersecting)) {
				onVisible();
				io.disconnect();
			}
		},
		{ rootMargin: '25%' }
	);

	io.observe(node);

	return {
		destroy: () => io.disconnect()
	};
}

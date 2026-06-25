/** iOS Safari (and similar): fixed UI vs floating browser chrome. Updates CSS vars on `el`. */
export function observeBrowserChromeInsets(el: HTMLElement) {
	const vv = window.visualViewport;
	if (!vv) return () => {};

	let raf = 0;

	const update = () => {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(() => {
			const top = Math.max(0, vv.offsetTop);
			const bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
			el.style.setProperty('--browser-chrome-top', `${top}px`);
			el.style.setProperty('--browser-chrome-bottom', `${bottom}px`);
		});
	};

	update();
	vv.addEventListener('resize', update);
	vv.addEventListener('scroll', update);
	window.addEventListener('resize', update);

	return () => {
		cancelAnimationFrame(raf);
		vv.removeEventListener('resize', update);
		vv.removeEventListener('scroll', update);
		window.removeEventListener('resize', update);
		el.style.removeProperty('--browser-chrome-top');
		el.style.removeProperty('--browser-chrome-bottom');
	};
}

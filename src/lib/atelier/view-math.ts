export type ViewTransform = { tx: number; ty: number; zoom: number };
export type ViewportRect = { width: number; height: number };

export function clampZoom(zoom: number, minZoom: number, maxZoom: number): number {
	return Math.max(minZoom, Math.min(maxZoom, zoom));
}

export function clampView(
	view: ViewTransform,
	viewport: ViewportRect,
	canvas: { width: number; height: number },
	/** Extra pan room (canvas px) so edge pieces clear mobile UI chrome. */
	panSlack = 64
): ViewTransform {
	const w = canvas.width * view.zoom;
	const h = canvas.height * view.zoom;
	const slack = panSlack * view.zoom;
	const minX = Math.min(0, viewport.width - w) - slack;
	const maxX = Math.max(0, viewport.width - w) + slack;
	const minY = Math.min(0, viewport.height - h) - slack;
	const maxY = Math.max(0, viewport.height - h) + slack;
	return {
		...view,
		tx: Math.max(Math.min(view.tx, maxX), minX),
		ty: Math.max(Math.min(view.ty, maxY), minY)
	};
}

export function zoomAtPoint(
	view: ViewTransform,
	viewportX: number,
	viewportY: number,
	nextZoom: number,
	minZoom: number,
	maxZoom: number
): ViewTransform {
	const zoom = clampZoom(nextZoom, minZoom, maxZoom);
	return {
		zoom,
		tx: viewportX - ((viewportX - view.tx) * zoom) / view.zoom,
		ty: viewportY - ((viewportY - view.ty) * zoom) / view.zoom
	};
}

export function fitViewToCanvas(
	viewport: ViewportRect,
	minZoom: number,
	canvas: { width: number; height: number },
	fitPadding = 0.95,
	insets: { top?: number; bottom?: number } = {}
): ViewTransform {
	const top = insets.top ?? 0;
	const bottom = insets.bottom ?? 0;
	const availW = viewport.width;
	const availH = Math.max(1, viewport.height - top - bottom);
	const fit =
		Math.min(availW / canvas.width, availH / canvas.height) * fitPadding;
	const zoom = Math.max(minZoom, fit);
	return {
		zoom,
		tx: (viewport.width - canvas.width * zoom) / 2,
		ty: top + (availH - canvas.height * zoom) / 2
	};
}

export function centreOnCanvas(
	viewport: ViewportRect,
	canvasX: number,
	canvasY: number,
	targetZoom: number
): ViewTransform {
	return {
		zoom: targetZoom,
		tx: viewport.width / 2 - canvasX * targetZoom,
		ty: viewport.height / 2 - canvasY * targetZoom
	};
}

export function fitZoomForItem(
	viewport: ViewportRect,
	itemW: number,
	itemH: number,
	fill: number,
	minZoom: number,
	maxZoom: number
): number {
	const byWidth = (viewport.width * fill) / Math.max(1, itemW);
	const byHeight = (viewport.height * fill) / Math.max(1, itemH);
	return clampZoom(Math.min(byWidth, byHeight), minZoom, maxZoom);
}

export function viewportToCanvas(view: ViewTransform, viewportX: number, viewportY: number) {
	return {
		x: (viewportX - view.tx) / view.zoom,
		y: (viewportY - view.ty) / view.zoom
	};
}

export function canvasCentre(view: ViewTransform, viewport: ViewportRect) {
	return viewportToCanvas(view, viewport.width / 2, viewport.height / 2);
}

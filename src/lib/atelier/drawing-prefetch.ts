import { drawings } from '$lib/content';
import { cacheAsset } from '$lib/drawing/asset-cache';

/** Queue full-res download for a drawing (idempotent per session). */
export function queueDrawingPrefetch(
	prefetchIds: Set<string>,
	id: string | null,
	onChange: (next: Set<string>) => void
) {
	if (!id || prefetchIds.has(id)) return;
	onChange(new Set([...prefetchIds, id]));
	const drawing = drawings.find((d) => d.id === id);
	if (drawing) void cacheAsset(drawing.src);
}

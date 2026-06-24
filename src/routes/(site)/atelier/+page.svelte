<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { drawings, tracks, artist, trackForDrawing, drawingForTrack, atelierMaxZoom } from '$lib/content';
	import BackLink from '$lib/components/BackLink.svelte';
	import AtelierDrawingImg from '$lib/components/AtelierDrawingImg.svelte';
	import AtelierNearCue from '$lib/components/AtelierNearCue.svelte';
	import { cacheAsset } from '$lib/drawing-asset-cache';
	import { enterSpatial, applySpatial, setNear, leaveSpatial, unlock } from '$lib/audio-engine.svelte';

	let focusedId = $state<string | null>(browser ? page.url.searchParams.get('focus') : null);
	let prefetchIds = $state(new Set<string>());

	const CANVAS_W = 2200;
	const CANVAS_H = 1400;
	const MIN_ZOOM = 0.25;
	const MAX_ZOOM = atelierMaxZoom();
	const PROX_RADIUS = 760;
	const ZOOM_GATE_LOW = 0.65;
	const ZOOM_GATE_HIGH = 0.95;

	let viewport = $state<HTMLDivElement>();
	let speakerRings = $state<HTMLSpanElement[]>([]);
	const PAN_CAP = 0.8;

	let zoom = $state(0.7);
	let tx = $state(0);
	let ty = $state(0);

	let dragging = $state(false);
	let dragStart = { x: 0, y: 0, tx: 0, ty: 0 };
	let hasUserNavigatedView = $state(false);

	type InteractionMode = 'idle' | 'pending-pan' | 'panning' | 'pinching';
	let interactionMode = $state<InteractionMode>('idle');
	let primaryPointerId = $state<number | null>(null);
	let primaryPointerType = $state<string>('mouse');
	let startedOnPiece = false;

	const PAN_THRESHOLD_MOUSE = 6;
	const PAN_THRESHOLD_TOUCH = 8;
	const PAN_THRESHOLD_PIECE = 18;

	const pointers = new Map<number, { x: number; y: number }>();
	type Pinch = { midX: number; midY: number; dist: number };
	let pinch: Pinch | undefined;

	function panThreshold() {
		if (primaryPointerType !== 'touch') return PAN_THRESHOLD_MOUSE;
		return startedOnPiece ? PAN_THRESHOLD_PIECE : PAN_THRESHOLD_TOUCH;
	}

	function queuePrefetch(id: string | null) {
		if (!id || prefetchIds.has(id)) return;
		prefetchIds = new Set([...prefetchIds, id]);
		const drawing = drawings.find((d) => d.id === id);
		if (drawing) void cacheAsset(drawing.src);
	}

	function drawingAtViewport(viewportX: number, viewportY: number): string | null {
		const cx = (viewportX - tx) / zoom;
		const cy = (viewportY - ty) / zoom;
		for (const d of drawings) {
			const w = d.width ?? 320;
			const h = w * 1.25;
			const x = d.pos?.x ?? 0;
			const y = d.pos?.y ?? 0;
			if (cx >= x && cx <= x + w && cy >= y && cy <= y + h) return d.id;
		}
		return null;
	}

	function clamp() {
		if (!viewport) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		const w = CANVAS_W * zoom;
		const h = CANVAS_H * zoom;
		const minX = Math.min(0, vw - w);
		const maxX = Math.max(0, vw - w);
		const minY = Math.min(0, vh - h);
		const maxY = Math.max(0, vh - h);
		tx = Math.max(Math.min(tx, Math.max(maxX, minX)), Math.min(maxX, minX));
		ty = Math.max(Math.min(ty, Math.max(maxY, minY)), Math.min(maxY, minY));
	}

	function applyZoomAt(viewportX: number, viewportY: number, nextZoom: number) {
		const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
		tx = viewportX - ((viewportX - tx) * clamped) / zoom;
		ty = viewportY - ((viewportY - ty) * clamped) / zoom;
		zoom = clamped;
		clamp();
		hasUserNavigatedView = true;
		queuePrefetch(drawingAtViewport(viewportX, viewportY));
	}

	function startPinch() {
		if (!viewport || pointers.size < 2) return;
		const [a, b] = Array.from(pointers.values()).slice(0, 2);
		const rect = viewport.getBoundingClientRect();
		pinch = {
			midX: (a.x + b.x) / 2 - rect.left,
			midY: (a.y + b.y) / 2 - rect.top,
			dist: Math.hypot(b.x - a.x, b.y - a.y)
		};
	}

	function updatePinch() {
		if (!viewport || !pinch || pointers.size < 2) return;
		const [a, b] = Array.from(pointers.values()).slice(0, 2);
		const rect = viewport.getBoundingClientRect();
		const midX = (a.x + b.x) / 2 - rect.left;
		const midY = (a.y + b.y) / 2 - rect.top;
		const dist = Math.hypot(b.x - a.x, b.y - a.y);

		tx += midX - pinch.midX;
		ty += midY - pinch.midY;
		applyZoomAt(midX, midY, zoom * (dist / pinch.dist));

		pinch = { midX, midY, dist };
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		unlock();
		stopInertia();
		if (pointers.size === 0) {
			const target = e.target as HTMLElement;
			startedOnPiece = !!target.closest('.piece--drawing');
			const pieceId = target.closest('[data-drawing-id]')?.getAttribute('data-drawing-id');
			if (pieceId) queuePrefetch(pieceId);
			if (target.closest('.speaker, .back')) return;
		}
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {}

		if (pointers.size === 1) {
			primaryPointerId = e.pointerId;
			primaryPointerType = e.pointerType || 'mouse';
			dragStart = { x: e.clientX, y: e.clientY, tx, ty };
			lastMove = { x: e.clientX, y: e.clientY, t: performance.now() };
			vx = 0;
			vy = 0;
			dragging = false;
			interactionMode = 'pending-pan';
		} else if (pointers.size === 2) {
			dragging = false;
			interactionMode = 'pinching';
			startPinch();
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (!pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size >= 2 || interactionMode === 'pinching') {
			interactionMode = 'pinching';
			updatePinch();
			return;
		}

		if (interactionMode === 'pending-pan' && e.pointerId === primaryPointerId) {
			const moved = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
			if (moved >= panThreshold()) {
				interactionMode = 'panning';
				dragging = true;
			}
		}

		if (interactionMode === 'panning' && e.pointerId === primaryPointerId) {
			tx = dragStart.tx + (e.clientX - dragStart.x);
			ty = dragStart.ty + (e.clientY - dragStart.y);
			clamp();
			hasUserNavigatedView = true;
			const now = performance.now();
			if (lastMove) {
				const dt = now - lastMove.t;
				if (dt > 0) {
					const nvx = (e.clientX - lastMove.x) / dt;
					const nvy = (e.clientY - lastMove.y) / dt;
					vx = vx * 0.2 + nvx * 0.8;
					vy = vy * 0.2 + nvy * 0.8;
				}
			}
			lastMove = { x: e.clientX, y: e.clientY, t: now };
		}
	}

	function onPointerUp(e: PointerEvent) {
		pointers.delete(e.pointerId);
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {}

		if (pointers.size < 2) pinch = undefined;
		if (pointers.size === 0) {
			const wasPanning = interactionMode === 'panning';
			dragging = false;
			interactionMode = 'idle';
			primaryPointerId = null;
			if (wasPanning) {
				startInertia();
			} else if (
				primaryPointerType === 'touch' &&
				viewport &&
				!(e.target as HTMLElement).closest(NON_CANVAS)
			) {
				const now = performance.now();
				if (
					now - lastTapTime < 300 &&
					Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 36
				) {
					const rect = viewport.getBoundingClientRect();
					zoomAtViewport(e.clientX - rect.left, e.clientY - rect.top, 1.7);
					lastTapTime = 0;
				} else {
					lastTapTime = now;
					lastTapX = e.clientX;
					lastTapY = e.clientY;
				}
			}
		} else if (pointers.size === 1) {
			const [p] = pointers.values();
			dragStart = { x: p.x, y: p.y, tx, ty };
			const [id] = pointers.keys();
			primaryPointerId = id;
			primaryPointerType = 'touch';
			dragging = false;
			interactionMode = 'pending-pan';
		}
	}

	function onWheel(e: WheelEvent) {
		if (!viewport) return;
		unlock();
		stopInertia();
		e.preventDefault();
		const rect = viewport.getBoundingClientRect();
		const cx = e.clientX - rect.left;
		const cy = e.clientY - rect.top;
		const deltaUnit =
			e.deltaMode === WheelEvent.DOM_DELTA_LINE
				? 16
				: e.deltaMode === WheelEvent.DOM_DELTA_PAGE
					? viewport.clientHeight
					: 1;
		const dx = e.deltaX * deltaUnit;
		const dy = e.deltaY * deltaUnit;
		if (e.ctrlKey || e.metaKey) {
			applyZoomAt(cx, cy, zoom * Math.exp(-dy * 0.0018));
		} else {
			tx -= dx;
			ty -= dy;
			clamp();
			hasUserNavigatedView = true;
		}
	}

	function zoomTo(centreX: number, centreY: number, target = 1.6, animate = false) {
		if (!viewport) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		const nextTx = vw / 2 - centreX * target;
		const nextTy = vh / 2 - centreY * target;
		if (animate && !prefersReducedMotion()) {
			animateView(nextTx, nextTy, target);
		} else {
			zoom = target;
			tx = nextTx;
			ty = nextTy;
			clamp();
		}
		hasUserNavigatedView = true;
	}

	function focusTargetZoom(itemW: number, itemH: number, fill = 0.74) {
		if (!viewport) return zoom;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		const byWidth = (vw * fill) / Math.max(1, itemW);
		const byHeight = (vh * fill) / Math.max(1, itemH);
		return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(byWidth, byHeight)));
	}

	function focusDrawing(d: (typeof drawings)[number]) {
		focusedId = d.id;
		queuePrefetch(d.id);
		const itemW = d.width ?? 320;
		const itemH = itemW * 1.25;
		const cx = (d.pos?.x ?? 0) + itemW / 2;
		const cy = (d.pos?.y ?? 0) + itemH / 2;
		const fitTarget = focusTargetZoom(itemW, itemH, 0.76);
		const steppedTarget = Math.min(MAX_ZOOM, zoom + 0.22);
		const target = Math.max(fitTarget, steppedTarget);
		zoomTo(cx, cy, target, true);
	}

	function focusSpeaker(track: (typeof tracks)[number]) {
		if (!track.pos) return;
		stopInertia();
		zoomTo(track.pos.x, track.pos.y, Math.max(zoom, ZOOM_GATE_HIGH + 0.15), true);
	}

	function resetView() {
		if (!viewport) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		const fit = Math.min(vw / CANVAS_W, vh / CANVAS_H) * 0.95;
		zoom = Math.max(MIN_ZOOM, fit);
		tx = (vw - CANVAS_W * zoom) / 2;
		ty = (vh - CANVAS_H * zoom) / 2;
		clamp();
		hasUserNavigatedView = false;
	}

	let inertiaRaf = 0;
	let viewAnimRaf = 0;
	let vx = 0;
	let vy = 0;
	let lastMove: { x: number; y: number; t: number } | null = null;

	function stopViewAnim() {
		if (viewAnimRaf) cancelAnimationFrame(viewAnimRaf);
		viewAnimRaf = 0;
	}

	function animateView(targetTx: number, targetTy: number, targetZoom: number, duration = 380) {
		stopViewAnim();
		const from = { tx, ty, zoom };
		const t0 = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - t0) / duration);
			const e = t * t * (3 - 2 * t);
			tx = from.tx + (targetTx - from.tx) * e;
			ty = from.ty + (targetTy - from.ty) * e;
			zoom = from.zoom + (targetZoom - from.zoom) * e;
			clamp();
			if (t < 1) viewAnimRaf = requestAnimationFrame(step);
			else viewAnimRaf = 0;
		};
		viewAnimRaf = requestAnimationFrame(step);
	}

	function stopInertia() {
		if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
		inertiaRaf = 0;
		stopViewAnim();
	}

	function prefersReducedMotion() {
		return (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function startInertia() {
		if (prefersReducedMotion()) return;
		if (lastMove && performance.now() - lastMove.t > 90) return;
		if (Math.hypot(vx, vy) < 0.08) return;
		let last = performance.now();
		const step = (now: number) => {
			const dt = Math.max(1, now - last);
			last = now;
			tx += vx * dt;
			ty += vy * dt;
			clamp();
			hasUserNavigatedView = true;
			const decay = Math.pow(0.94, dt / 16.67);
			vx *= decay;
			vy *= decay;
			if (Math.hypot(vx, vy) < 0.02) {
				stopInertia();
				return;
			}
			inertiaRaf = requestAnimationFrame(step);
		};
		inertiaRaf = requestAnimationFrame(step);
	}

	function onKeyDown(e: KeyboardEvent) {
		unlock();
		const PAN = 90;
		const ZOOM_IN = 1.15;
		const vw = viewport?.clientWidth ?? 0;
		const vh = viewport?.clientHeight ?? 0;
		let handled = true;
		switch (e.key) {
			case 'ArrowLeft':
			case 'a':
			case 'A':
				tx += PAN;
				break;
			case 'ArrowRight':
			case 'd':
			case 'D':
				tx -= PAN;
				break;
			case 'ArrowUp':
			case 'w':
			case 'W':
				ty += PAN;
				break;
			case 'ArrowDown':
			case 's':
			case 'S':
				ty -= PAN;
				break;
			case '+':
			case '=':
				applyZoomAt(vw / 2, vh / 2, zoom * ZOOM_IN);
				break;
			case '-':
			case '_':
				applyZoomAt(vw / 2, vh / 2, zoom / ZOOM_IN);
				break;
			case '0':
			case 'r':
			case 'R':
				resetView();
				break;
			case 'Escape':
				goto(`${base}/`);
				break;
			default:
				handled = false;
		}
		if (handled) {
			e.preventDefault();
			stopInertia();
			clamp();
			hasUserNavigatedView = true;
		}
	}

	const NON_CANVAS = '.piece, .speaker, .back';

	function onDblClick(e: MouseEvent) {
		if (!viewport) return;
		if ((e.target as HTMLElement).closest(NON_CANVAS)) return;
		stopInertia();
		const rect = viewport.getBoundingClientRect();
		applyZoomAt(e.clientX - rect.left, e.clientY - rect.top, zoom * 1.7);
	}

	function zoomAtViewport(viewportX: number, viewportY: number, factor: number) {
		if (!viewport) return;
		const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
		const nextTx = viewportX - ((viewportX - tx) * nextZoom) / zoom;
		const nextTy = viewportY - ((viewportY - ty) * nextZoom) / zoom;
		if (prefersReducedMotion()) {
			applyZoomAt(viewportX, viewportY, nextZoom);
		} else {
			stopInertia();
			animateView(nextTx, nextTy, nextZoom);
			hasUserNavigatedView = true;
		}
	}

	let lastTapTime = 0;
	let lastTapX = 0;
	let lastTapY = 0;

	let raf = 0;
	function updateAudio() {
		if (!viewport) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		const centreCanvasX = (vw / 2 - tx) / zoom;
		const centreCanvasY = (vh / 2 - ty) / zoom;
		const zg = Math.max(
			0,
			Math.min(1, (zoom - ZOOM_GATE_LOW) / (ZOOM_GATE_HIGH - ZOOM_GATE_LOW))
		);
		const zoomGate = zg * zg * (3 - 2 * zg);
		let nearIndex = -1;
		let nearLevel = 0;
		tracks.forEach((track, i) => {
			if (!track.pos) return;
			const dx = track.pos.x - centreCanvasX;
			const dy = track.pos.y - centreCanvasY;
			const dist = Math.hypot(dx, dy);
			const t = Math.max(0, 1 - dist / PROX_RADIUS);
			const vol = t * t * (3 - 2 * t) * zoomGate;
			const screenX = tx + track.pos.x * zoom;
			const pan = Math.max(-1, Math.min(1, (screenX - vw / 2) / (vw / 2))) * PAN_CAP;
			applySpatial(i, vol, pan);
			const ring = speakerRings[i];
			if (ring) ring.style.setProperty('--level', vol.toFixed(3));
			if (vol > nearLevel) {
				nearLevel = vol;
				nearIndex = i;
			}
		});
		setNear(nearLevel > 0.05 ? nearIndex : -1, nearLevel);
		raf = requestAnimationFrame(updateAudio);
	}

	onMount(() => {
		resetView();
		enterSpatial();
		raf = requestAnimationFrame(updateAudio);

		if (focusedId) {
			queuePrefetch(focusedId);
			const drawing = drawings.find((d) => d.id === focusedId);
			if (drawing) void tick().then(() => focusDrawing(drawing));
		}

		const onTouchMove = (e: TouchEvent) => {
			if (pointers.size > 0) e.preventDefault();
		};

		const onResize = () => {
			if (hasUserNavigatedView) clamp();
			else resetView();
		};

		void tick().then(() => {
			viewport?.addEventListener('wheel', onWheel, { passive: false });
			viewport?.addEventListener('touchmove', onTouchMove, { passive: false });
		});

		window.addEventListener('resize', onResize);
		window.addEventListener('keydown', onKeyDown);
		return () => {
			viewport?.removeEventListener('wheel', onWheel);
			viewport?.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('keydown', onKeyDown);
			stopInertia();
			cancelAnimationFrame(raf);
			leaveSpatial();
		};
	});

</script>

<svelte:head>
	<title>De werktafel — {artist.name}</title>
</svelte:head>

<div class="atelier">
	<BackLink />
	<AtelierNearCue />

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="atelier__viewport"
		bind:this={viewport}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		ondblclick={onDblClick}
		class:atelier__viewport--dragging={dragging}
	>
		<div
			class="atelier__inner"
			style:transform="translate({tx}px, {ty}px) scale({zoom})"
			style:width="{CANVAS_W}px"
			style:height="{CANVAS_H}px"
		>
			{#each drawings as drawing (drawing.id)}
				{@const pairedTrack = trackForDrawing(drawing.id)}
				<button
					type="button"
					class="piece piece--drawing"
					data-drawing-id={drawing.id}
					style:left="{drawing.pos?.x ?? 0}px"
					style:top="{drawing.pos?.y ?? 0}px"
					style:width="{drawing.width ?? 320}px"
					style:--rot="{drawing.rotation ?? 0}deg"
					onclick={() => focusDrawing(drawing)}
					aria-label={pairedTrack
						? `${drawing.title} — ${pairedTrack.title}`
						: drawing.title}
				>
					<AtelierDrawingImg
						drawing={drawing}
						prefetch={prefetchIds.has(drawing.id)}
						viewTransitionName={drawing.id === focusedId ? `piece-${drawing.id}` : undefined}
					/>
				</button>
			{/each}

			{#each tracks as track, i (track.id)}
				{@const pairedDrawing = drawingForTrack(track.id)}
				<button
					type="button"
					class="piece speaker"
					style:left="{track.pos?.x ?? 0}px"
					style:top="{track.pos?.y ?? 0}px"
					onclick={() => focusSpeaker(track)}
					aria-label={pairedDrawing
						? `Ga naar {track.title} bij {pairedDrawing.title}`
						: `Ga naar {track.title} door {track.composer}`}
				>
					<span class="speaker__ring" bind:this={speakerRings[i]}></span>
					<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
						<path
							d="M3 9v6h4l5 4V5L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
						/>
					</svg>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.atelier {
		background: #c9c0a8;
		color: #1a1814;
		height: 100vh;
		height: 100svh;
		overflow: hidden;
		position: relative;
		font-family: var(--font-serif);
		background-image: radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
			linear-gradient(180deg, #d4cbb3, #bfb59c);
		background-size: 8px 8px, 100% 100%;
		touch-action: none;
		overscroll-behavior: none;
	}

	.atelier__viewport {
		position: absolute;
		inset: 0;
		touch-action: none;
		cursor: grab;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}

	.atelier__viewport--dragging {
		cursor: grabbing;
	}

	.atelier__inner {
		position: relative;
		transform-origin: 0 0;
		will-change: transform;
	}

	.piece {
		position: absolute;
		transform: rotate(var(--rot, 0deg));
	}

	.piece--drawing {
		appearance: none;
		background: #fbf6e9;
		border: none;
		padding: 14px 14px 36px;
		box-shadow: 0 18px 36px -22px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.2);
		cursor: zoom-in;
		display: block;
		transition: transform 250ms ease, box-shadow 250ms ease;
		touch-action: manipulation;
	}

	.piece--drawing:hover {
		transform: rotate(var(--rot, 0deg)) translateY(-3px);
		box-shadow: 0 28px 48px -22px rgba(0, 0, 0, 0.5), 0 3px 10px -2px rgba(0, 0, 0, 0.25);
		z-index: 10;
	}

	.speaker {
		appearance: none;
		background: var(--color-ink);
		color: var(--color-paper);
		border: none;
		width: 3rem;
		height: 3rem;
		min-width: 44px;
		min-height: 44px;
		border-radius: 9999px;
		display: grid;
		place-items: center;
		cursor: pointer;
		box-shadow: 0 14px 30px -16px rgba(0, 0, 0, 0.6);
		transform: translate(-50%, -50%);
		touch-action: manipulation;
	}

	.speaker__ring {
		position: absolute;
		inset: -8px;
		border-radius: 9999px;
		opacity: var(--level, 0);
		transition: opacity 140ms linear;
	}

	.speaker__ring::after {
		content: '';
		position: absolute;
		inset: 0;
		border: 1px solid rgba(0, 0, 0, 0.4);
		border-radius: 9999px;
		animation: speaker-pulse 2.4s ease-out infinite;
	}

	@keyframes speaker-pulse {
		0% {
			transform: scale(1);
			opacity: 0.6;
		}
		100% {
			transform: scale(1.8);
			opacity: 0;
		}
	}

</style>

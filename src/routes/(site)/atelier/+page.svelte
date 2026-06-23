<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { drawings, tracks, artist } from '$lib/content';
	import BackLink from '$lib/components/BackLink.svelte';
	import {
		enterSpatial,
		applySpatial,
		setNear,
		leaveSpatial,
		unlock
	} from '$lib/audio-engine.svelte';

	// The currently focused piece. Seeded from the deep link (?focus=<id>) coming
	// from a drawing's detail page, then updated whenever the viewer focuses a
	// drawing here. It drives (a) the auto-focus on entry, (b) the shared-element
	// view transition name, and (c) the "open detail" affordance — completing the
	// werk ↔ werktafel round trip. Guard with `browser`: searchParams is
	// inaccessible during prerender.
	let focusedId = $state<string | null>(browser ? page.url.searchParams.get('focus') : null);
	const focusedDrawing = $derived(
		focusedId ? drawings.find((d) => d.id === focusedId) : undefined
	);

	// Canvas dimensions — large worktable that the viewer pans/zooms over.
	const CANVAS_W = 2200;
	const CANVAS_H = 1400;
	const MIN_ZOOM = 0.25;
	const MAX_ZOOM = 2.5;
	const PROX_RADIUS = 760; // canvas-px distance over which a track is audible
	// Zoom gate: tracks are silent when zoomed out and only sound once the
	// viewer has zoomed in close. Below LOW = silent, at/above HIGH = full.
	const ZOOM_GATE_LOW = 0.65;
	const ZOOM_GATE_HIGH = 0.95;

	let viewport = $state<HTMLDivElement>();
	// Speaker ring elements, used to reflect live loudness without reactive churn.
	let speakerRings = $state<HTMLSpanElement[]>([]);

	// Cap pan so a track never collapses fully into one channel — keeps single
	// earbud listening usable and is gentler on phone speakers.
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

	// Multi-pointer tracking for pinch-zoom on touch.
	const pointers = new Map<number, { x: number; y: number }>();
	type Pinch = { midX: number; midY: number; dist: number };
	let pinch: Pinch | undefined;

	// Clamp the pan so we never lose the canvas off-screen.
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
		// Keep the point under (viewportX, viewportY) stationary.
		tx = viewportX - ((viewportX - tx) * clamped) / zoom;
		ty = viewportY - ((viewportY - ty) * clamped) / zoom;
		zoom = clamped;
		clamp();
		hasUserNavigatedView = true;
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

		// 1. Pan by midpoint translation.
		tx += midX - pinch.midX;
		ty += midY - pinch.midY;
		// 2. Zoom around the current midpoint by the distance change.
		applyZoomAt(midX, midY, zoom * (dist / pinch.dist));

		pinch = { midX, midY, dist };
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		unlockAudio();
		// Any interaction ends the intro drift / momentum and hands over control.
		cancelAutoMotion();
		// Drawings allow drag-or-tap (the browser auto-suppresses click after
		// movement). Only UI chrome and the audio speaker toggles are exempt,
		// so their own click handlers always win.
		if (pointers.size === 0) {
			const target = e.target as HTMLElement;
			if (target.closest('.speaker, .atelier__reset, .back'))
				return;
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
			const threshold = primaryPointerType === 'touch' ? 10 : 6;
			if (moved >= threshold) {
				interactionMode = 'panning';
				dragging = true;
			}
		}

		if (interactionMode === 'panning' && e.pointerId === primaryPointerId) {
			tx = dragStart.tx + (e.clientX - dragStart.x);
			ty = dragStart.ty + (e.clientY - dragStart.y);
			clamp();
			hasUserNavigatedView = true;
			// Track a smoothed pointer velocity for momentum on release.
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
				// Double-tap to zoom on touch (empty table only).
				const now = performance.now();
				if (
					now - lastTapTime < 300 &&
					Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 36
				) {
					const rect = viewport.getBoundingClientRect();
					applyZoomAt(e.clientX - rect.left, e.clientY - rect.top, zoom * 1.7);
					lastTapTime = 0;
				} else {
					lastTapTime = now;
					lastTapX = e.clientX;
					lastTapY = e.clientY;
				}
			}
		} else if (pointers.size === 1) {
			// Lift one finger of a pinch — continue as a drag with the survivor.
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
		unlockAudio();
		cancelAutoMotion();
		e.preventDefault();
		const rect = viewport.getBoundingClientRect();
		const cx = e.clientX - rect.left;
		const cy = e.clientY - rect.top;
		// Normalize wheel deltas so behavior is consistent across browsers/devices.
		const deltaUnit =
			e.deltaMode === WheelEvent.DOM_DELTA_LINE
				? 16
				: e.deltaMode === WheelEvent.DOM_DELTA_PAGE
					? viewport.clientHeight
					: 1;
		const dx = e.deltaX * deltaUnit;
		const dy = e.deltaY * deltaUnit;
		// macOS trackpad pinch fires wheel events with ctrlKey set; treat that
		// (and a real Ctrl+wheel) as zoom. Plain wheel = pan.
		if (e.ctrlKey || e.metaKey) {
			applyZoomAt(cx, cy, zoom * Math.exp(-dy * 0.0018));
		} else {
			tx -= dx;
			ty -= dy;
			clamp();
			hasUserNavigatedView = true;
		}
	}

	// Zoom-to-fit a drawing centered.
	function zoomTo(centreX: number, centreY: number, target = 1.6) {
		if (!viewport) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		zoom = target;
		tx = vw / 2 - centreX * target;
		ty = vh / 2 - centreY * target;
		clamp();
		hasUserNavigatedView = true;
	}

	function focusTargetZoom(itemW: number, itemH: number, fill = 0.74) {
		if (!viewport) return zoom;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		// Pick the zoom where the item occupies ~fill of the viewport while
		// still fitting both dimensions.
		const byWidth = (vw * fill) / Math.max(1, itemW);
		const byHeight = (vh * fill) / Math.max(1, itemH);
		return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(byWidth, byHeight)));
	}

	function focusDrawing(d: (typeof drawings)[number]) {
		focusedId = d.id;
		const itemW = d.width ?? 320;
		const itemH = itemW * 1.25;
		const cx = (d.pos?.x ?? 0) + itemW / 2;
		const cy = (d.pos?.y ?? 0) + itemH / 2;
		const fitTarget = focusTargetZoom(itemW, itemH, 0.76);
		const steppedTarget = Math.min(MAX_ZOOM, zoom + 0.22);
		const target = Math.max(fitTarget, steppedTarget);
		zoomTo(cx, cy, target);
	}

	// Clicking a speaker brings the viewer close enough that it starts to sound.
	function focusSpeaker(track: (typeof tracks)[number]) {
		if (!track.pos) return;
		cancelAutoMotion();
		zoomTo(track.pos.x, track.pos.y, Math.max(zoom, ZOOM_GATE_HIGH + 0.15));
	}

	function resetView() {
		if (!viewport) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		// Fit the canvas to the viewport, but never below MIN_ZOOM —
		// on small phone screens "fit" would render the pieces unreadably small.
		const fit = Math.min(vw / CANVAS_W, vh / CANVAS_H) * 0.95;
		zoom = Math.max(MIN_ZOOM, fit);
		tx = (vw - CANVAS_W * zoom) / 2;
		ty = (vh - CANVAS_H * zoom) / 2;
		clamp();
		hasUserNavigatedView = false;
	}

	// Intro "drift": on first entry the view glides past each speaker on its own
	// so the proximity sound audibly swells, pans, and fades — teaching the
	// spatial concept without text. Any user input hands control straight back.
	let tourRaf = 0;
	let touring = false;

	function cancelTour() {
		if (!touring && !tourRaf) return;
		if (tourRaf) cancelAnimationFrame(tourRaf);
		tourRaf = 0;
		touring = false;
	}

	function prefersReducedMotion() {
		return (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function runIntroTour() {
		if (!viewport || prefersReducedMotion()) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		const fitZoom = zoom;
		const tourZoom = Math.max(fitZoom, Math.min(MAX_ZOOM, 0.9));
		// easeInOutQuad for a calm, hand-of-the-curator glide.
		const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

		type Waypoint = { cx: number; cy: number; z: number };
		const startPoint: Waypoint = {
			cx: (vw / 2 - tx) / zoom,
			cy: (vh / 2 - ty) / zoom,
			z: zoom
		};
		const speakerStops: Waypoint[] = tracks
			.filter((t) => t.pos)
			.map((t) => ({ cx: t.pos!.x, cy: t.pos!.y, z: tourZoom }));
		const waypoints: Waypoint[] = [
			startPoint,
			...speakerStops,
			{ cx: CANVAS_W / 2, cy: CANVAS_H / 2, z: fitZoom }
		];

		const SEG_MS = 1900;
		let seg = 0;
		let segStart = performance.now();
		touring = true;

		const frame = (now: number) => {
			if (!touring || !viewport) return;
			const a = waypoints[seg];
			const b = waypoints[seg + 1];
			if (!b) {
				cancelTour();
				return;
			}
			const u = Math.min(1, (now - segStart) / SEG_MS);
			const e = ease(u);
			const cx = a.cx + (b.cx - a.cx) * e;
			const cy = a.cy + (b.cy - a.cy) * e;
			const z = a.z + (b.z - a.z) * e;
			zoom = z;
			tx = viewport.clientWidth / 2 - cx * z;
			ty = viewport.clientHeight / 2 - cy * z;
			clamp();
			if (u >= 1) {
				seg += 1;
				segStart = now;
				if (seg >= waypoints.length - 1) {
					cancelTour();
					return;
				}
			}
			tourRaf = requestAnimationFrame(frame);
		};
		tourRaf = requestAnimationFrame(frame);
	}

	// --- Momentum panning (inertia) ---
	let inertiaRaf = 0;
	let vx = 0; // px per ms
	let vy = 0;
	let lastMove: { x: number; y: number; t: number } | null = null;

	function stopInertia() {
		if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
		inertiaRaf = 0;
	}

	function startInertia() {
		if (prefersReducedMotion()) return;
		// Ignore a release that followed a pause (no real flick).
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

	// Any deliberate user input cancels both the intro drift and momentum.
	function cancelAutoMotion() {
		cancelTour();
		stopInertia();
	}

	// --- Keyboard navigation (desktop) ---
	function onKeyDown(e: KeyboardEvent) {
		unlockAudio();
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
				leave();
				break;
			default:
				handled = false;
		}
		if (handled) {
			e.preventDefault();
			cancelAutoMotion();
			clamp();
			hasUserNavigatedView = true;
		}
	}

	// --- Double-click / double-tap to zoom ---
	const NON_CANVAS = '.piece, .speaker, .atelier__reset, .back';

	function onDblClick(e: MouseEvent) {
		if (!viewport) return;
		if ((e.target as HTMLElement).closest(NON_CANVAS)) return;
		cancelAutoMotion();
		const rect = viewport.getBoundingClientRect();
		applyZoomAt(e.clientX - rect.left, e.clientY - rect.top, zoom * 1.7);
	}

	let lastTapTime = 0;
	let lastTapX = 0;
	let lastTapY = 0;

	// Proximity audio. RAF loop computes each track's gain from distance to the
	// viewport centre and pans it by its on-screen horizontal offset.
	let raf = 0;
	function updateAudio() {
		if (!viewport) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		// Centre of viewport in canvas coordinates:
		const centreCanvasX = (vw / 2 - tx) / zoom;
		const centreCanvasY = (vh / 2 - ty) / zoom;
		// Smoothstep zoom gate — no music when zoomed out.
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
			// Proximity falloff, gated by zoom: audible only when close AND zoomed in.
			const t = Math.max(0, 1 - dist / PROX_RADIUS);
			const prox = t * t * (3 - 2 * t);
			const vol = prox * zoomGate;

			const screenX = tx + track.pos.x * zoom;
			const pan = Math.max(-1, Math.min(1, (screenX - vw / 2) / (vw / 2))) * PAN_CAP;

			// The shared engine owns the nodes/elements: it schedules click-free
			// gain/pan ramps and play/pauses each track as it becomes audible.
			applySpatial(i, vol, pan);

			// Reflect loudness on the speaker ring without triggering reactivity.
			const ring = speakerRings[i];
			if (ring) ring.style.setProperty('--level', vol.toFixed(3));

			if (vol > nearLevel) {
				nearLevel = vol;
				nearIndex = i;
			}
		});
		// Drive the immersive "now near" cue with the loudest track.
		setNear(nearLevel > 0.05 ? nearIndex : -1, nearLevel);
		raf = requestAnimationFrame(updateAudio);
	}

	// The experience runs immediately on load. Browser autoplay policy means
	// audio can't sound until a user gesture, so it is unlocked (via the shared
	// engine) on the first interaction; the proximity loop then decides when
	// each track sounds.
	function unlockAudio() {
		unlock();
	}

	function stop() {
		cancelAutoMotion();
		cancelAnimationFrame(raf);
		raf = 0;
		// Silence spatial tracks and hand the engine back to playlist mode.
		leaveSpatial();
	}

	function leave() {
		stop();
		goto(`${base}/`);
	}

	onMount(() => {
		resetView();
		enterSpatial();
		raf = requestAnimationFrame(updateAudio);

		if (focusedId) {
			const drawing = drawings.find((d) => d.id === focusedId);
			if (drawing) void tick().then(() => focusDrawing(drawing));
		} else {
			runIntroTour();
		}

		const onResize = () => {
			// Keep the user's current framing after they have started navigating;
			// only recenter when still in the initial untouched state.
			if (hasUserNavigatedView) {
				clamp();
			} else {
				resetView();
			}
		};
		window.addEventListener('resize', onResize);
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('keydown', onKeyDown);
			cancelAutoMotion();
			cancelAnimationFrame(raf);
			// Leave the shared engine intact (it persists across views); just
			// silence spatial playback and restore playlist mode.
			leaveSpatial();
		};
	});

</script>

<svelte:head>
	<title>De werktafel — {artist.name}</title>
</svelte:head>

<div class="atelier">
	<BackLink theme="light" label="Galerij" />

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="atelier__viewport"
		bind:this={viewport}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onwheel={onWheel}
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
				<button
					type="button"
					class="piece piece--drawing"
					style:left="{drawing.pos?.x ?? 0}px"
					style:top="{drawing.pos?.y ?? 0}px"
					style:width="{drawing.width ?? 320}px"
					style:--rot="{drawing.rotation ?? 0}deg"
					onclick={() => focusDrawing(drawing)}
					aria-label={drawing.title}
				>
					<img
						src={drawing.src}
						alt={drawing.alt}
						style:view-transition-name={drawing.id === focusedId
							? `piece-${drawing.id}`
							: undefined}
					/>
				</button>
			{/each}

			{#each tracks as track, i (track.id)}
				<button
					type="button"
					class="piece speaker"
					style:left="{track.pos?.x ?? 0}px"
					style:top="{track.pos?.y ?? 0}px"
					onclick={() => focusSpeaker(track)}
					aria-label="Ga naar {track.title} door {track.composer}"
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

	<button type="button" class="atelier__reset" onclick={resetView} aria-label="Beeld herstellen">
		↺
	</button>

	{#if focusedDrawing}
		<a class="atelier__open" href="{base}/werk/{focusedDrawing.id}/">
			<span class="atelier__open-title">{focusedDrawing.title}</span>
			<span class="atelier__open-cta" aria-hidden="true">bekijk ↗</span>
		</a>
	{/if}
</div>

<style>
	.atelier {
		background: #c9c0a8;
		color: #1a1814;
		height: 100vh;
		height: 100svh; /* iOS Safari: avoid jumping under the dynamic chrome */
		overflow: hidden;
		position: relative;
		font-family: var(--font-serif);
		background-image: radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
			linear-gradient(180deg, #d4cbb3, #bfb59c);
		background-size:
			8px 8px,
			100% 100%;
		/* Prevent the browser from intercepting touch gestures we handle ourselves. */
		touch-action: none;
		overscroll-behavior: none;
	}

	.atelier__viewport {
		position: absolute;
		inset: 0;
		touch-action: none;
		cursor: grab;
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
	}

	.piece--drawing:hover {
		transform: rotate(var(--rot, 0deg)) translateY(-3px);
		box-shadow: 0 28px 48px -22px rgba(0, 0, 0, 0.5), 0 3px 10px -2px rgba(0, 0, 0, 0.25);
		z-index: 10;
	}

	.piece--drawing img {
		display: block;
		width: 100%;
		height: auto;
		pointer-events: none;
	}

	.speaker {
		appearance: none;
		background: var(--color-ink);
		color: var(--color-paper);
		border: none;
		width: 3rem;
		height: 3rem;
		border-radius: 9999px;
		display: grid;
		place-items: center;
		cursor: pointer;
		box-shadow: 0 14px 30px -16px rgba(0, 0, 0, 0.6);
	}

	.speaker__ring {
		position: absolute;
		inset: -8px;
		border-radius: 9999px;
		/* Live loudness from the RAF loop; silent speakers show no ring. */
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

	.atelier__reset {
		position: absolute;
		top: 1rem;
		right: 4rem;
		appearance: none;
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(0, 0, 0, 0.2);
		padding: 0.5rem 1rem;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 20;
	}

	/* Open the focused drawing's detail page — the atelier → werk return trip. */
	.atelier__open {
		position: absolute;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		max-width: calc(100vw - 2rem);
		padding: 0.45rem 1rem;
		border-radius: 9999px;
		background: rgba(20, 18, 14, 0.55);
		color: #efe9da;
		text-decoration: none;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 25;
		transition: background 200ms ease;
	}

	.atelier__open:hover {
		background: rgba(20, 18, 14, 0.72);
	}

	.atelier__open-title {
		font-family: var(--font-museum);
		font-style: italic;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.atelier__open-cta {
		font-family: var(--font-sans);
		font-size: 0.6rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		opacity: 0.75;
		flex: none;
	}
</style>

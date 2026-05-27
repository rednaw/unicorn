<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { drawings, poems, tracks, artist } from '$lib/content';

	// Canvas dimensions — large worktable that the viewer pans/zooms over.
	const CANVAS_W = 2200;
	const CANVAS_H = 1400;
	const MIN_ZOOM = 0.25;
	const MAX_ZOOM = 2.5;
	const PROX_RADIUS = 520; // canvas-px distance over which a track is audible

	let started = $state(false);
	let viewport = $state<HTMLDivElement>();
	let audioEls = $state<HTMLAudioElement[]>([]);

	// Web Audio plumbing — iOS Safari ignores HTMLAudioElement.volume,
	// so proximity gain must route through GainNodes.
	let audioCtx: AudioContext | undefined;
	let gainNodes: GainNode[] = [];
	let audioGraphReady = false;

	function setupAudioGraph() {
		if (audioGraphReady) return;
		const Ctx: typeof AudioContext =
			window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		audioCtx = new Ctx();
		audioEls.forEach((a, i) => {
			const source = audioCtx!.createMediaElementSource(a);
			const gain = audioCtx!.createGain();
			gain.gain.value = 0;
			source.connect(gain).connect(audioCtx!.destination);
			gainNodes[i] = gain;
		});
		audioGraphReady = true;
	}

	let zoom = $state(0.7);
	let tx = $state(0);
	let ty = $state(0);

	let dragging = $state(false);
	let dragStart = { x: 0, y: 0, tx: 0, ty: 0 };

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
		// Drawings allow drag-or-tap (the browser auto-suppresses click after
		// movement). Only UI chrome and the audio speaker toggles are exempt,
		// so their own click handlers always win.
		if (pointers.size === 0) {
			const target = e.target as HTMLElement;
			if (target.closest('.speaker, .atelier__reset, .atelier__back, .minimap')) return;
		}
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {}

		if (pointers.size === 1) {
			dragging = true;
			dragStart = { x: e.clientX, y: e.clientY, tx, ty };
		} else if (pointers.size === 2) {
			dragging = false;
			startPinch();
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (!pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size >= 2) {
			updatePinch();
		} else if (dragging) {
			tx = dragStart.tx + (e.clientX - dragStart.x);
			ty = dragStart.ty + (e.clientY - dragStart.y);
			clamp();
		}
	}

	function onPointerUp(e: PointerEvent) {
		pointers.delete(e.pointerId);
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {}

		if (pointers.size < 2) pinch = undefined;
		if (pointers.size === 0) {
			dragging = false;
		} else if (pointers.size === 1) {
			// Lift one finger of a pinch — continue as a drag with the survivor.
			const [p] = pointers.values();
			dragStart = { x: p.x, y: p.y, tx, ty };
			dragging = true;
		}
	}

	function onWheel(e: WheelEvent) {
		if (!viewport) return;
		e.preventDefault();
		const rect = viewport.getBoundingClientRect();
		const cx = e.clientX - rect.left;
		const cy = e.clientY - rect.top;
		// macOS trackpad pinch fires wheel events with ctrlKey set; treat that
		// (and a real Ctrl+wheel) as zoom. Plain wheel = pan.
		if (e.ctrlKey || e.metaKey) {
			applyZoomAt(cx, cy, zoom * Math.exp(-e.deltaY * 0.01));
		} else {
			tx -= e.deltaX;
			ty -= e.deltaY;
			clamp();
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
	}

	function focusDrawing(d: (typeof drawings)[number]) {
		const cx = (d.pos?.x ?? 0) + (d.width ?? 320) / 2;
		const cy = (d.pos?.y ?? 0) + ((d.width ?? 320) * 1.25) / 2;
		zoomTo(cx, cy, 1.4);
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
	}

	// Proximity audio. RAF loop computes each track's gain from distance.
	let raf = 0;
	function updateAudio() {
		if (!viewport) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		// Centre of viewport in canvas coordinates:
		const centreCanvasX = (vw / 2 - tx) / zoom;
		const centreCanvasY = (vh / 2 - ty) / zoom;
		tracks.forEach((track, i) => {
			if (!track.pos) return;
			const gain = gainNodes[i];
			if (!gain) return;
			const dx = track.pos.x - centreCanvasX;
			const dy = track.pos.y - centreCanvasY;
			const dist = Math.hypot(dx, dy);
			const vol = Math.max(0, 1 - dist / PROX_RADIUS);
			gain.gain.value = vol * vol;
		});
		raf = requestAnimationFrame(updateAudio);
	}

	async function start() {
		started = true;
		setupAudioGraph();
		try {
			await audioCtx?.resume();
		} catch {}
		for (const a of audioEls) {
			a.loop = true;
			try {
				await a.play();
			} catch {}
		}
		raf = requestAnimationFrame(updateAudio);
	}

	onMount(() => {
		resetView();
		const onResize = () => {
			resetView();
		};
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
			cancelAnimationFrame(raf);
			for (const a of audioEls) a.pause();
			audioCtx?.close().catch(() => {});
		};
	});

	const minimapScale = 200 / CANVAS_W;
	const minimapH = $derived(CANVAS_H * minimapScale);
	const viewBox = $derived({
		x: -tx / zoom,
		y: -ty / zoom,
		w: viewport ? viewport.clientWidth / zoom : 0,
		h: viewport ? viewport.clientHeight / zoom : 0
	});
</script>

<svelte:head>
	<title>Atelier — V. Solenne</title>
</svelte:head>

<div class="atelier">
	{#if !started}
		<div class="atelier__overlay" role="dialog" aria-modal="true">
			<a class="atelier__back" href="{base}/" aria-label="Terug naar de index">←</a>
			<p class="atelier__eyebrow">Een oneindige werktafel</p>
			<h1 class="atelier__title">{artist.name}</h1>
			<p class="atelier__hint">
				Sleep om te verplaatsen, scrol of knijp om te zoomen, tik op een tekening om die te
				focussen. Het geluid stijgt naarmate je een luidspreker nadert.
			</p>
			<button type="button" class="atelier__begin" onclick={start}>Binnen</button>
		</div>
	{/if}

	<div class="atelier__audio" aria-hidden="true">
		{#each tracks as track, i (track.id)}
			<audio bind:this={audioEls[i]} src={track.src} preload="auto"></audio>
		{/each}
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="atelier__viewport"
		bind:this={viewport}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onwheel={onWheel}
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
					<img src={drawing.src} alt={drawing.alt} />
					<span class="piece__label">{drawing.title}</span>
				</button>
			{/each}

			{#each poems as poem (poem.id)}
				<div
					class="piece piece--poem"
					style:left="{poem.pos?.x ?? 0}px"
					style:top="{poem.pos?.y ?? 0}px"
					style:--rot="{poem.rotation ?? 0}deg"
				>
					<div class="piece__poem">
						<h3>{poem.title}</h3>
						{#each poem.lines as line, li (li)}
							{#if line === ''}
								<div class="piece__break"></div>
							{:else}
								<p>{line}</p>
							{/if}
						{/each}
						<p class="piece__author">— {poem.author}</p>
					</div>
				</div>
			{/each}

			{#each tracks as track, i (track.id)}
				<button
					type="button"
					class="piece speaker"
					style:left="{track.pos?.x ?? 0}px"
					style:top="{track.pos?.y ?? 0}px"
					onclick={() => {
						const a = audioEls[i];
						if (!a) return;
						a.paused ? a.play() : a.pause();
					}}
					aria-label="{track.title} door {track.composer}"
				>
					<span class="speaker__ring"></span>
					<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
						<path
							d="M3 9v6h4l5 4V5L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
						/>
					</svg>
					<span class="speaker__label">{track.title}<br /><em>{track.composer}</em></span>
				</button>
			{/each}
		</div>
	</div>

	<button type="button" class="atelier__reset" onclick={resetView} aria-label="Beeld herstellen">
		Passen
	</button>

	{#if started}
		<aside class="minimap" aria-label="Minikaart">
			<svg viewBox="0 0 {CANVAS_W * minimapScale} {minimapH}" width="200" height={minimapH}>
				<rect width={CANVAS_W * minimapScale} height={minimapH} fill="#efe9da" opacity="0.5" />
				{#each drawings as d (d.id)}
					<rect
						x={(d.pos?.x ?? 0) * minimapScale}
						y={(d.pos?.y ?? 0) * minimapScale}
						width={(d.width ?? 320) * minimapScale}
						height={(d.width ?? 320) * 1.25 * minimapScale}
						fill="#3a2e22"
						opacity="0.5"
					/>
				{/each}
				{#each tracks as t (t.id)}
					<circle
						cx={(t.pos?.x ?? 0) * minimapScale}
						cy={(t.pos?.y ?? 0) * minimapScale}
						r="3"
						fill="#3a2e22"
					/>
				{/each}
				<rect
					x={viewBox.x * minimapScale}
					y={viewBox.y * minimapScale}
					width={viewBox.w * minimapScale}
					height={viewBox.h * minimapScale}
					fill="none"
					stroke="#0e0c08"
					stroke-width="1.5"
				/>
			</svg>
		</aside>
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

	.atelier__overlay {
		position: absolute;
		inset: 0;
		background: rgba(201, 192, 168, 0.96);
		display: grid;
		place-items: center;
		align-content: center;
		gap: 1rem;
		text-align: center;
		z-index: 100;
		padding: 2rem;
	}

	.atelier__back {
		position: absolute;
		top: 1.5rem;
		left: 1.5rem;
		font-size: 1.25rem;
		color: var(--color-ink-soft);
		opacity: 0.6;
		text-decoration: none;
	}

	.atelier__eyebrow {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		opacity: 0.7;
		margin: 0;
	}

	.atelier__title {
		font-family: var(--font-display);
		font-size: clamp(3rem, 8vw, 5rem);
		font-weight: 400;
		line-height: 1;
		margin: 0.5rem 0;
		letter-spacing: -0.01em;
	}

	.atelier__hint {
		max-width: 26rem;
		font-style: italic;
		opacity: 0.75;
		margin: 0 0 1.5rem;
		line-height: 1.55;
	}

	.atelier__begin {
		appearance: none;
		background: var(--color-ink);
		border: none;
		color: var(--color-paper);
		padding: 1.1rem 2.75rem;
		min-height: 48px; /* iOS HIG: comfortable tap target */
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		cursor: pointer;
		transition: transform 200ms ease;
	}

	.atelier__begin:hover {
		transform: translateY(-1px);
	}

	.atelier__audio {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
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

	.piece__label {
		display: block;
		text-align: center;
		font-family: var(--font-museum);
		font-style: italic;
		font-size: 1rem;
		margin-top: 0.5rem;
		color: var(--color-ink-soft);
	}

	.piece--poem {
		width: 22rem;
		max-width: 22rem;
	}

	.piece__poem {
		background: #fefaee;
		padding: 1.25rem 1.5rem 1.5rem;
		box-shadow: 0 12px 32px -18px rgba(0, 0, 0, 0.3);
		font-family: var(--font-serif);
		color: var(--color-ink);
		/* Torn-paper edges */
		--edge: radial-gradient(circle at 50% 100%, #fefaee 99%, transparent 100%);
		mask-image: linear-gradient(180deg, #000 0%, #000 calc(100% - 12px), transparent calc(100% - 6px)),
			radial-gradient(circle at 8px 0, transparent 5px, #000 6px),
			radial-gradient(circle at 24px 0, transparent 5px, #000 6px),
			radial-gradient(circle at 40px 0, transparent 4px, #000 5px);
	}

	.piece__poem h3 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.1rem;
		margin: 0 0 0.5rem;
	}

	.piece__poem p {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.45;
	}

	.piece__break {
		height: 0.6em;
	}

	.piece__author {
		margin-top: 0.6rem !important;
		font-family: var(--font-sans);
		font-size: 0.68rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		opacity: 0.7;
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

	.speaker__label {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translate(-50%, 6px);
		white-space: nowrap;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		color: var(--color-ink);
		text-align: center;
		line-height: 1.4;
	}

	.speaker__label em {
		font-style: italic;
		opacity: 0.6;
	}

	.atelier__reset {
		position: absolute;
		top: 1rem;
		right: 1rem;
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

	.minimap {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		background: rgba(255, 255, 255, 0.55);
		padding: 4px;
		border: 1px solid rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		z-index: 20;
		line-height: 0;
	}
</style>

<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { drawings, poems, tracks, artist } from '$lib/content';
	import BackLink from '$lib/components/BackLink.svelte';

	// Compose 3 "acts" — each act pairs ~2 drawings, a poem, and a track.
	type Act = {
		title: string;
		drawings: typeof drawings;
		poem: (typeof poems)[number];
		track: (typeof tracks)[number];
	};

	const acts: Act[] = [
		{
			title: 'I. De hand',
			drawings: [drawings[0], drawings[3]],
			poem: poems.find((p) => p.id === 'mei') ?? poems[0],
			track: tracks[0]
		},
		{
			title: 'II. Het lichaam',
			drawings: [drawings[1], drawings[4]],
			poem: poems.find((p) => p.id === 'holland') ?? poems[2],
			track: tracks[1]
		},
		{
			title: 'III. Het gezicht',
			drawings: [drawings[2], drawings[5]],
			poem: poems.find((p) => p.id === 'zachte-krachten') ?? poems[0],
			track: tracks[2]
		}
	];

	let started = $state(false);
	let progress = $state(0);
	let audioEls = $state<HTMLAudioElement[]>([]);
	let actEls = $state<HTMLElement[]>([]);

	let lenis: import('lenis').default | undefined;

	// Web Audio plumbing — iOS Safari ignores HTMLAudioElement.volume, so we
	// must route audio through GainNodes to control track volumes.
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
			gain.gain.value = i === 0 ? 1 : 0;
			source.connect(gain).connect(audioCtx!.destination);
			gainNodes[i] = gain;
		});
		audioGraphReady = true;
	}

	async function start() {
		started = true;
		setupAudioGraph();
		try {
			await audioCtx?.resume();
		} catch {}
		for (const a of audioEls) {
			a.loop = true;
			a.play().catch(() => {});
		}

		const [{ default: Lenis }, gsapMod, scrollTriggerMod] = await Promise.all([
			import('lenis'),
			import('gsap'),
			import('gsap/ScrollTrigger')
		]);
		const gsap = gsapMod.default;
		const ScrollTrigger = scrollTriggerMod.ScrollTrigger;
		gsap.registerPlugin(ScrollTrigger);

		lenis = new Lenis({ smoothWheel: true, duration: 1.1 });
		lenis.on('scroll', ScrollTrigger.update);
		gsap.ticker.add((time) => lenis!.raf(time * 1000));
		gsap.ticker.lagSmoothing(0);

		// Global progress + audio crossfade
		ScrollTrigger.create({
			start: 0,
			end: 'max',
			onUpdate: (self) => {
				progress = self.progress;
				crossfadeAudio(self.progress);
			}
		});

		// Per-act animations. Title is visible from the start; drawings + poem
		// fade in as you scroll into the act, then everything fades out at the end.
		actEls.forEach((act) => {
			if (!act) return;
			const drawingsEl = act.querySelectorAll<HTMLElement>('.act__drawing');
			const poemEl = act.querySelector<HTMLElement>('.act__poem');
			const titleEl = act.querySelector<HTMLElement>('.act__title');

			gsap.set(drawingsEl, { autoAlpha: 0, scale: 0.94 });
			gsap.set(poemEl, { autoAlpha: 0, y: 30 });

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: act,
					start: 'top top',
					end: '+=2200',
					scrub: 0.6,
					pin: true,
					anticipatePin: 1
				}
			});

			tl.to(drawingsEl[0], { autoAlpha: 1, scale: 1, duration: 0.5 })
				.to(drawingsEl[0], { autoAlpha: 0.18, duration: 0.4 }, '+=0.5')
				.to(drawingsEl[1], { autoAlpha: 1, scale: 1, duration: 0.5 }, '<')
				.to(poemEl, { autoAlpha: 1, y: 0, duration: 0.5 }, '+=0.1')
				.to({}, { duration: 0.6 })
				.to([drawingsEl, poemEl, titleEl], { autoAlpha: 0, duration: 0.3 });
		});

		ScrollTrigger.refresh();
	}

	function crossfadeAudio(p: number) {
		// p is global scroll progress 0..1. Track i is at full volume when
		// p === i/(n-1) and silent at adjacent centres. Routed through Web
		// Audio GainNodes because iOS Safari ignores HTMLAudioElement.volume.
		const n = audioEls.length;
		const width = 1 / Math.max(1, n - 1);
		audioEls.forEach((_, i) => {
			const centre = i / Math.max(1, n - 1);
			const distance = Math.abs(p - centre) / width;
			const vol = Math.max(0, 1 - distance);
			const gain = gainNodes[i];
			if (gain) gain.gain.value = vol;
		});
	}

	function stop() {
		for (const a of audioEls) {
			a.pause();
			a.currentTime = 0;
		}
		started = false;
	}

	onMount(() => {
		return () => {
			if (lenis) lenis.destroy();
			audioCtx?.close().catch(() => {});
		};
	});
</script>

<svelte:head>
	<title>Verhaal — V. Solenne</title>
</svelte:head>

<div class="scrollv">
	<BackLink theme="dark" />

	{#if !started}
		<div class="scrollv__overlay" role="dialog" aria-modal="true" aria-labelledby="verhaal-title">
			<p class="scrollv__eyebrow">Drie bedrijven</p>
			<h1 id="verhaal-title" class="scrollv__title">{artist.name}</h1>
			<p class="scrollv__hint">
				Dit stuk onthult zich terwijl je scrolt. Het geluid vervaagt tussen de bedrijven.
			</p>
			<button type="button" class="scrollv__begin" onclick={start}>Begin</button>
		</div>
	{/if}

	<div class="scrollv__progress" style:--p="{progress * 100}%" aria-hidden={!started}></div>

	{#if started}
		<button type="button" class="scrollv__close" onclick={stop} aria-label="Sluiten">×</button>
	{/if}

	<!-- Pre-load audio elements (always present so the refs exist) -->
	<div class="scrollv__audio" aria-hidden="true">
		{#each tracks as track, i (track.id)}
			<audio bind:this={audioEls[i]} src={track.src} preload="auto"></audio>
		{/each}
	</div>

	{#each acts as act, i (i)}
		<section class="act" bind:this={actEls[i]} aria-label={act.title}>
			<div class="act__inner">
				<header class="act__title">
					<span class="act__num">Bedrijf {String(i + 1).padStart(2, '0')}</span>
					<h2>{act.title}</h2>
					{#if i === 0}
						<p class="act__hint">Scroll om verder te gaan</p>
					{/if}
				</header>
				<div class="act__stage">
					{#each act.drawings as drawing, di (drawing.id)}
						<figure class="act__drawing" data-pos={di === 0 ? 'a' : 'b'}>
							<img src={drawing.src} alt={drawing.alt} />
						</figure>
					{/each}
				</div>
				<div class="act__poem">
					<h3>{act.poem.title}</h3>
					{#each act.poem.lines as line, li (li)}
						{#if line === ''}
							<div class="act__break"></div>
						{:else}
							<p>{line}</p>
						{/if}
					{/each}
					<p class="act__poem-author">— {act.poem.author}</p>
					<p class="act__track-meta">{act.track.title} · {act.track.composer}</p>
				</div>
			</div>
		</section>
	{/each}

	<section class="scrollv__outro">
		<p>— einde van de drie bedrijven —</p>
		<a href="{base}/">Terug naar de index</a>
	</section>
</div>

<style>
	.scrollv {
		background: #0e0c08;
		color: #efe9da;
		min-height: 100vh;
		font-family: var(--font-serif);
		overflow-x: hidden;
	}

	.scrollv__overlay {
		position: fixed;
		inset: 0;
		background: #0e0c08;
		display: grid;
		place-items: center;
		gap: 1rem;
		z-index: 100;
		text-align: center;
		padding: 2rem;
		align-content: center;
	}

	.scrollv__eyebrow {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		opacity: 0.6;
		margin: 0;
	}

	.scrollv__title {
		font-family: var(--font-display);
		font-size: clamp(3rem, 9vw, 6rem);
		line-height: 1;
		margin: 0.5rem 0;
		letter-spacing: -0.01em;
	}

	.scrollv__hint {
		max-width: 24rem;
		font-style: italic;
		opacity: 0.7;
		margin: 0 0 1.5rem;
		font-size: 0.95rem;
		line-height: 1.55;
	}

	.scrollv__begin {
		appearance: none;
		background: none;
		border: 1px solid #efe9da;
		color: #efe9da;
		padding: 0.85rem 2.5rem;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		cursor: pointer;
		transition: background 250ms ease, color 250ms ease;
	}

	.scrollv__begin:hover {
		background: #efe9da;
		color: #0e0c08;
	}

	.scrollv__progress {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: rgba(239, 233, 218, 0.15);
		z-index: 60;
	}

	.scrollv__progress::after {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: var(--p);
		background: #efe9da;
	}

	.scrollv__close {
		position: fixed;
		top: 1rem;
		right: 1.5rem;
		z-index: 50;
		background: none;
		border: none;
		color: #efe9da;
		font-size: 2rem;
		cursor: pointer;
		opacity: 0.4;
		transition: opacity 200ms ease;
	}

	.scrollv__close:hover {
		opacity: 1;
	}

	.scrollv__audio {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
	}

	.act {
		min-height: 100vh;
		position: relative;
	}

	.act__inner {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 2rem;
		padding: clamp(2rem, 6vw, 5rem);
		max-width: 80rem;
		margin: 0 auto;
	}

	.act__title {
		text-align: center;
	}

	.act__num {
		display: block;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		opacity: 0.5;
	}

	.act__title h2 {
		font-family: var(--font-display);
		font-style: italic;
		font-size: clamp(1.75rem, 4vw, 3rem);
		font-weight: 400;
		line-height: 1;
		margin: 0.5rem 0 0;
	}

	.act__hint {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		opacity: 0.4;
		margin: 1rem 0 0;
		animation: bob 2.4s ease-in-out infinite;
	}

	@keyframes bob {
		0%, 100% { transform: translateY(0); opacity: 0.4; }
		50% { transform: translateY(4px); opacity: 0.7; }
	}

	.act__stage {
		position: relative;
		display: grid;
		place-items: center;
	}

	.act__drawing {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
	}

	.act__drawing img {
		max-width: 80%;
		max-height: 100%;
		object-fit: contain;
		filter: invert(0.9) hue-rotate(180deg) brightness(1.05);
	}

	.act__poem {
		max-width: 32rem;
		margin: 0 auto;
		text-align: center;
		opacity: 0.95;
	}

	.act__poem h3 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.35rem;
		margin: 0 0 0.85rem;
	}

	.act__poem p {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.55;
	}

	.act__break {
		height: 0.7em;
	}

	.act__poem-author {
		margin-top: 1.1rem !important;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.6;
	}

	.act__track-meta {
		font-family: var(--font-sans);
		font-size: 0.68rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.4;
		margin-top: 0.5rem !important;
	}

	.scrollv__outro {
		min-height: 60vh;
		display: grid;
		place-items: center;
		gap: 1.5rem;
		font-family: var(--font-display);
		font-style: italic;
		opacity: 0.6;
	}

	.scrollv__outro a {
		font-family: var(--font-sans);
		font-style: normal;
		font-size: 0.72rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: inherit;
		text-decoration: none;
		opacity: 0.8;
	}
</style>

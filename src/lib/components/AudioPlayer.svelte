<script lang="ts">
	import type { Track } from '$lib/content';
	import { site } from '$lib/site-state.svelte';
	import { claim, release } from './audio-bus';

	type Variant = 'inline' | 'docked' | 'minimal';

	let {
		track,
		variant = 'inline',
		autoplay = false,
		playToken,
		pauseToken,
		onnext,
		onprev,
		class: className = ''
	}: {
		track: Track;
		variant?: Variant;
		autoplay?: boolean;
		playToken?: number;
		pauseToken?: number;
		onnext?: () => void;
		onprev?: () => void;
		class?: string;
	} = $props();

	let audio = $state<HTMLAudioElement>();
	let playing = $state(false);
	let current = $state(0);
	let duration = $state(0);

	const progress = $derived(duration > 0 ? (current / duration) * 100 : 0);
	const showTransport = $derived(variant !== 'minimal' && (onnext || onprev));

	function syncPlaying(value: boolean) {
		if (playToken !== undefined) site.isPlaying = value;
	}

	$effect(() => {
		return () => {
			if (audio) {
				audio.pause();
				release(audio);
			}
		};
	});

	$effect(() => {
		if (playToken === undefined || playToken === 0) return;
		track.src;
		const el = audio;
		if (!el) return;
		void el.play().catch(() => {});
	});

	$effect(() => {
		if (pauseToken === undefined || pauseToken === 0) return;
		audio?.pause();
	});

	function toggle() {
		if (!audio) return;
		audio.paused ? audio.play() : audio.pause();
	}

	function format(t: number): string {
		if (!isFinite(t) || t < 0) return '0:00';
		const m = Math.floor(t / 60);
		const s = Math.floor(t % 60)
			.toString()
			.padStart(2, '0');
		return `${m}:${s}`;
	}

	function seek(e: MouseEvent) {
		if (!audio || !duration) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const ratio = (e.clientX - rect.left) / rect.width;
		audio.currentTime = Math.max(0, Math.min(duration, ratio * duration));
	}
</script>

<div class="player player--{variant} {className}">
	<audio
		bind:this={audio}
		src={track.src}
		{autoplay}
		preload="metadata"
		onplay={() => {
			playing = true;
			syncPlaying(true);
			if (audio) claim(audio);
		}}
		onpause={() => {
			playing = false;
			syncPlaying(false);
			if (audio) release(audio);
		}}
		ontimeupdate={() => (current = audio?.currentTime ?? 0)}
		onloadedmetadata={() => (duration = audio?.duration ?? 0)}
		onended={() => {
			playing = false;
			syncPlaying(false);
			if (audio) release(audio);
			onnext?.();
		}}
	></audio>

	{#if showTransport && onprev}
		<button
			type="button"
			class="player__nav"
			onclick={onprev}
			aria-label="Vorig stuk"
		>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
				<path d="M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z" />
			</svg>
		</button>
	{/if}

	<button
		type="button"
		class="player__btn"
		onclick={toggle}
		aria-label={playing ? `Pauzeer ${track.title}` : `Speel ${track.title}`}
	>
		{#if playing}
			<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
				<rect x="6" y="5" width="4" height="14" />
				<rect x="14" y="5" width="4" height="14" />
			</svg>
		{:else}
			<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
				<path d="M7 5v14l12-7z" />
			</svg>
		{/if}
	</button>

	{#if showTransport && onnext}
		<button
			type="button"
			class="player__nav"
			onclick={onnext}
			aria-label="Volgend stuk"
		>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
				<path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
			</svg>
		</button>
	{/if}

	<div class="player__meta">
		<div class="player__title">{track.title}</div>
		<div class="player__composer">{track.composer}</div>
	</div>

	{#if variant !== 'minimal'}
		<button
			type="button"
			class="player__progress"
			onclick={seek}
			aria-label="Spoel naar: {format(current)} van {format(duration)}"
		>
			<span class="player__bar" style:width="{progress}%"></span>
		</button>

		<span class="player__time">{format(current)} / {format(duration)}</span>
	{/if}
</div>

<style>
	.player {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-family: var(--font-sans);
		font-size: 0.875rem;
		color: var(--color-ink);
	}

	.player__btn {
		flex: none;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 9999px;
		display: grid;
		place-items: center;
		background: var(--color-ink);
		color: var(--color-paper);
		border: none;
		cursor: pointer;
		transition: transform 150ms ease;
	}

	.player__btn:hover {
		transform: scale(1.05);
	}

	.player__nav {
		flex: none;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 9999px;
		display: grid;
		place-items: center;
		background: transparent;
		color: var(--color-ink-soft);
		border: none;
		cursor: pointer;
		opacity: 0.75;
		transition: opacity 150ms ease, transform 150ms ease;
	}

	.player__nav:hover {
		opacity: 1;
		transform: scale(1.05);
	}

	.player__meta {
		min-width: 0;
		line-height: 1.2;
	}

	.player__title {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.player__composer {
		font-style: italic;
		opacity: 0.7;
		font-size: 0.78rem;
	}

	.player__progress {
		flex: 1;
		height: 2px;
		background: rgba(0, 0, 0, 0.15);
		border: none;
		padding: 0;
		position: relative;
		cursor: pointer;
		overflow: hidden;
	}

	.player__progress::before {
		content: '';
		position: absolute;
		inset: -8px 0;
	}

	.player__bar {
		display: block;
		height: 100%;
		background: var(--color-ink);
		transition: width 80ms linear;
	}

	.player__time {
		font-variant-numeric: tabular-nums;
		opacity: 0.6;
		font-size: 0.75rem;
		flex: none;
	}

	/* Docked: frosted glass, fixed at bottom-center */
	.player--docked {
		position: fixed;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.5rem 0.85rem;
		min-width: min(100%, 20rem);
		max-width: calc(100vw - 1.5rem);
		background: color-mix(in oklab, var(--color-wall) 88%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-radius: 9999px;
		box-shadow: 0 8px 28px -14px rgba(0, 0, 0, 0.22);
		z-index: 50;
		gap: 0.5rem;
	}

	@media (max-width: 540px) {
		.player--docked .player__time {
			display: none;
		}

		.player--docked .player__composer {
			display: none;
		}
	}

	/* Inline: in flow, footnote-like */
	.player--inline {
		padding: 0.5rem 0.75rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	/* Minimal: just play + title */
	.player--minimal {
		gap: 0.5rem;
	}
</style>

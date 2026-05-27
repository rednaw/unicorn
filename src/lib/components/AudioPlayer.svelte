<script lang="ts">
	import type { Track } from '$lib/content';
	import { claim, release } from './audio-bus';

	type Variant = 'inline' | 'docked' | 'minimal';

	let {
		track,
		variant = 'inline',
		autoplay = false,
		class: className = ''
	}: {
		track: Track;
		variant?: Variant;
		autoplay?: boolean;
		class?: string;
	} = $props();

	let audio = $state<HTMLAudioElement>();
	let playing = $state(false);
	let current = $state(0);
	let duration = $state(0);

	const progress = $derived(duration > 0 ? (current / duration) * 100 : 0);

	$effect(() => {
		// Cleanup on unmount: stop playback and free the audio bus.
		return () => {
			if (audio) {
				audio.pause();
				release(audio);
			}
		};
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
			if (audio) claim(audio);
		}}
		onpause={() => {
			playing = false;
			if (audio) release(audio);
		}}
		ontimeupdate={() => (current = audio?.currentTime ?? 0)}
		onloadedmetadata={() => (duration = audio?.duration ?? 0)}
		onended={() => {
			playing = false;
			if (audio) release(audio);
		}}
	></audio>

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
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.75rem 1.25rem;
		min-width: 24rem;
		max-width: calc(100vw - 2rem);
		background: color-mix(in oklab, var(--color-wall) 85%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-radius: 9999px;
		box-shadow: 0 12px 36px -16px rgba(0, 0, 0, 0.25);
		z-index: 50;
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

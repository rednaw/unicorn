<script lang="ts">
	import { base } from '$app/paths';

	type Theme = 'light' | 'dark';

	let {
		theme = 'light' as Theme,
		label = 'Overzicht',
		fixed = true,
		compact = false
	}: { theme?: Theme; label?: string; fixed?: boolean; compact?: boolean } = $props();
</script>

<a
	class="back back--{theme}"
	class:back--fixed={fixed}
	class:back--compact={compact}
	href="{base}/"
	aria-label="Terug naar de galerij"
>
	<span class="back__arrow" aria-hidden="true">←</span>
	{#if !compact}
		<span class="back__label">{label}</span>
	{/if}
</a>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.5rem 0.95rem 0.5rem 0.75rem;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		text-decoration: none;
		border-radius: 9999px;
		opacity: 0.9;
		transition: opacity 200ms ease, transform 200ms ease, background 200ms ease;
		min-height: 36px;
	}

	.back:hover,
	.back:focus-visible {
		opacity: 1;
		transform: translateX(-2px);
		outline: none;
	}

	.back--fixed {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 110; /* above the atelier intro overlay (z-index 100) */
	}

	.back--light {
		color: #1d1a16;
		background: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(0, 0, 0, 0.12);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.back--light:hover,
	.back--light:focus-visible {
		background: rgba(255, 255, 255, 0.95);
	}

	.back--dark {
		color: #efe9da;
		background: rgba(20, 18, 14, 0.6);
		border: 1px solid rgba(239, 233, 218, 0.22);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.back--dark:hover,
	.back--dark:focus-visible {
		background: rgba(20, 18, 14, 0.85);
	}

	.back--compact {
		padding: 0.45rem 0.55rem;
		gap: 0;
	}

	.back__arrow {
		font-size: 1.1rem;
		line-height: 1;
		transform: translateY(-1px);
	}
</style>

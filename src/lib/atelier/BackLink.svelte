<script lang="ts">
	import { base } from '$app/paths';
</script>

<a class="back" href="{base}/" aria-label="Terug naar de galerij">
	<span aria-hidden="true">←</span>
</a>

<style>
	.back {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0px) + 1rem);
		left: max(1rem, env(safe-area-inset-left, 0px));
		z-index: 110;
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 9999px;
		color: #1d1a16;
		background: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(0, 0, 0, 0.12);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		text-decoration: none;
		font-size: 1.1rem;
		line-height: 1;
		opacity: 0.9;
		/* transform for browser-chrome offset — excluded from CLS (unlike top/bottom). */
		transform: translateY(var(--browser-chrome-top, 0px));
		transition: opacity 200ms ease, transform 200ms ease, background 200ms ease;
	}

	.back:hover,
	.back:focus-visible {
		opacity: 1;
		transform: translateY(var(--browser-chrome-top, 0px)) translateX(-2px);
		background: rgba(255, 255, 255, 0.95);
		outline: none;
	}
</style>

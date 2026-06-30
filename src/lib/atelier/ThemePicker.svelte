<script lang="ts">
	import { ATELIER_THEMES, type AtelierThemeId } from './atelier-themes';
	import { atelierTheme, setAtelierTheme } from './atelier-theme.svelte';
</script>

<div class="theme-picker" aria-label="Room theme (temporary)">
	<label class="theme-picker__label">
		<span class="theme-picker__tag">theme</span>
		<select
			class="theme-picker__select"
			value={atelierTheme.id}
			onchange={(e) => setAtelierTheme(e.currentTarget.value as AtelierThemeId)}
		>
			{#each ATELIER_THEMES as theme (theme.id)}
				<option value={theme.id}>{theme.label}</option>
			{/each}
		</select>
	</label>
</div>

<style>
	.theme-picker {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0px) + 1rem);
		right: max(1rem, env(safe-area-inset-right, 0px));
		z-index: 110;
		transform: translateY(var(--browser-chrome-top, 0px));
	}

	.theme-picker__label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.55rem 0.35rem 0.65rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.75);
		border: 1px solid rgba(0, 0, 0, 0.12);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		font-family: var(--font-sans);
		font-size: 0.68rem;
		color: #1d1a16;
	}

	.theme-picker__tag {
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.55;
	}

	.theme-picker__select {
		appearance: none;
		border: none;
		background: transparent;
		font: inherit;
		color: inherit;
		cursor: pointer;
		padding: 0;
		max-width: 9rem;
	}

	.theme-picker__select:focus-visible {
		outline: 2px solid rgba(0, 0, 0, 0.25);
		outline-offset: 2px;
		border-radius: 2px;
	}
</style>

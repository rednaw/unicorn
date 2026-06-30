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
		/* Stays out of the way until hovered/focused — it's a temporary dev control. */
		opacity: 0.22;
		transition: opacity 220ms ease;
	}

	.theme-picker:hover,
	.theme-picker:focus-within {
		opacity: 1;
	}

	.theme-picker__label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.5rem 0.3rem 0.6rem;
		border-radius: 9999px;
		border: 1px solid transparent;
		background: transparent;
		font-family: var(--font-sans);
		font-size: 0.66rem;
		color: var(--lib-text, #1d1a16);
		transition: background 220ms ease, border-color 220ms ease;
	}

	.theme-picker:hover .theme-picker__label,
	.theme-picker:focus-within .theme-picker__label {
		background: rgba(255, 255, 255, 0.75);
		border-color: rgba(0, 0, 0, 0.12);
		color: #1d1a16;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.theme-picker__tag {
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.55;
	}

	/* Label text hidden at rest — a faint dot is enough; full control on reveal. */
	.theme-picker:not(:hover):not(:focus-within) .theme-picker__tag {
		width: 0.4rem;
		height: 0.4rem;
		overflow: hidden;
		border-radius: 9999px;
		background: currentColor;
		text-indent: -999px;
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

	/* Collapse the select at rest so only the dot shows. */
	.theme-picker:not(:hover):not(:focus-within) .theme-picker__select {
		width: 0;
		max-width: 0;
		opacity: 0;
	}

	.theme-picker__select:focus-visible {
		outline: 2px solid rgba(0, 0, 0, 0.25);
		outline-offset: 2px;
		border-radius: 2px;
	}
</style>

<script lang="ts">
	import type { Drawing } from '$lib/content';

	let {
		drawing,
		clickable = true,
		eager = false,
		showCaption = false,
		class: className = ''
	}: {
		drawing: Drawing;
		clickable?: boolean;
		eager?: boolean;
		showCaption?: boolean;
		class?: string;
	} = $props();

	let zoomed = $state(false);

	function close() {
		zoomed = false;
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={onKey} />

<figure class="drawing {className}">
	{#if clickable}
		<button
			type="button"
			class="drawing__trigger"
			onclick={() => (zoomed = true)}
			aria-label={`Bekijk ${drawing.title} uitvergroot`}
		>
			<img src={drawing.src} alt={drawing.alt} loading={eager ? 'eager' : 'lazy'} />
		</button>
	{:else}
		<img src={drawing.src} alt={drawing.alt} loading={eager ? 'eager' : 'lazy'} />
	{/if}

	{#if showCaption}
		<figcaption class="drawing__caption">
			<strong>{drawing.title}</strong>
			<span>{drawing.year} · {drawing.medium}</span>
		</figcaption>
	{/if}
</figure>

{#if zoomed}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="drawing__modal"
		role="dialog"
		aria-modal="true"
		aria-label={drawing.title}
		tabindex="-1"
		onclick={close}
	>
		<button type="button" class="drawing__close" onclick={close} aria-label="Sluiten">×</button>
		<figure class="drawing__modal-figure">
			<img src={drawing.src} alt={drawing.alt} />
			<figcaption class="drawing__modal-caption">
				<strong>{drawing.title}</strong>
				<span>{drawing.year} · {drawing.medium}</span>
			</figcaption>
		</figure>
	</div>
{/if}

<style>
	.drawing {
		margin: 0;
	}

	.drawing__trigger {
		appearance: none;
		background: none;
		border: none;
		padding: 0;
		cursor: zoom-in;
		display: block;
		width: 100%;
	}

	.drawing img {
		display: block;
		width: 100%;
		height: auto;
		max-width: 100%;
	}

	.drawing__caption {
		margin-top: 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		display: flex;
		gap: 0.5rem;
		justify-content: space-between;
	}

	.drawing__caption strong {
		font-weight: 500;
	}

	.drawing__modal {
		position: fixed;
		inset: 0;
		background: rgba(15, 13, 10, 0.92);
		display: grid;
		place-items: center;
		z-index: 100;
		cursor: zoom-out;
		padding: 2rem;
		animation: fade 200ms ease;
	}

	.drawing__modal-figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
	}

	.drawing__modal img {
		max-width: 90vw;
		max-height: 80vh;
		object-fit: contain;
		display: block;
	}

	.drawing__modal-caption {
		text-align: center;
		color: var(--color-paper);
		font-family: var(--font-museum);
		font-style: italic;
	}

	.drawing__modal-caption strong {
		font-style: normal;
		display: block;
		font-size: 1.2rem;
	}

	.drawing__close {
		position: absolute;
		top: 1rem;
		right: 1.5rem;
		background: none;
		border: none;
		color: var(--color-paper);
		font-size: 2.5rem;
		line-height: 1;
		cursor: pointer;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}
</style>

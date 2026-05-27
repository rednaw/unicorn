<script lang="ts">
	import type { Poem } from '$lib/content';

	let {
		poem,
		showAuthor = true,
		showTitle = true,
		class: className = ''
	}: {
		poem: Poem;
		showAuthor?: boolean;
		showTitle?: boolean;
		class?: string;
	} = $props();
</script>

<figure class="poem {className}">
	{#if showTitle}
		<h3 class="poem__title">{poem.title}</h3>
	{/if}
	<div class="poem__body">
		{#each poem.lines as line, i (i)}
			{#if line === ''}
				<div class="poem__break" aria-hidden="true"></div>
			{:else}
				<p class="poem__line">{line}</p>
			{/if}
		{/each}
	</div>
	{#if showAuthor}
		<figcaption class="poem__author">— {poem.author}</figcaption>
	{/if}
</figure>

<style>
	.poem {
		margin: 0;
		font-family: var(--font-serif);
		color: var(--color-ink);
		line-height: 1.55;
		max-width: 36ch;
	}

	.poem__title {
		font-family: var(--font-museum);
		font-style: italic;
		font-weight: 400;
		font-size: 1.35rem;
		margin: 0 0 0.85rem;
		letter-spacing: 0.01em;
	}

	.poem__body {
		display: flex;
		flex-direction: column;
	}

	.poem__line {
		margin: 0;
		font-size: 1.02rem;
	}

	.poem__break {
		height: 0.8em;
	}

	.poem__author {
		margin-top: 0.85rem;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
	}
</style>

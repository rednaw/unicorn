<script lang="ts">
	import { cacheAsset, peekCachedAsset } from '$lib/drawing/asset-cache';

	let {
		url,
		alt = '',
		class: className = '',
		loading,
		viewTransitionName
	}: {
		url: string;
		alt?: string;
		class?: string;
		loading?: 'lazy' | 'eager' | null;
		viewTransitionName?: string;
	} = $props();

	let src = $state<string | undefined>(undefined);

	$effect(() => {
		const cached = peekCachedAsset(url);
		if (cached) {
			src = cached;
			return;
		}
		let cancelled = false;
		void cacheAsset(url).then((resolved) => {
			if (!cancelled) src = resolved;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

{#if src}
	<img
		class={className}
		{src}
		{alt}
		{loading}
		decoding="async"
		style:view-transition-name={viewTransitionName}
	/>
{/if}

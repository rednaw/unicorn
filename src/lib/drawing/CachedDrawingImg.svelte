<script lang="ts">
	import { cacheAsset, peekCachedAsset } from '$lib/drawing/asset-cache';

	let {
		url,
		alt = '',
		class: className = '',
		width,
		height,
		loading,
		viewTransitionName
	}: {
		url: string;
		alt?: string;
		class?: string;
		/** Intrinsic width — reserves aspect ratio before decode. */
		width: number;
		height: number;
		loading?: 'lazy' | 'eager' | null;
		viewTransitionName?: string;
	} = $props();

	let resolvedSrc = $state<string | undefined>(undefined);
	const src = $derived(resolvedSrc ?? peekCachedAsset(url));

	$effect(() => {
		const assetUrl = url;
		let cancelled = false;
		void cacheAsset(assetUrl).then((resolved) => {
			if (!cancelled) resolvedSrc = resolved;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

{#if src}
	<img
		class={className}
		src={src}
		{width}
		{height}
		{alt}
		{loading}
		decoding="async"
		style:view-transition-name={viewTransitionName}
	/>
{/if}

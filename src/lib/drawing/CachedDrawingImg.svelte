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

	let src = $state<string | undefined>(peekCachedAsset(url));

	$effect(() => {
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
		{width}
		{height}
		{alt}
		{loading}
		decoding="async"
		style:view-transition-name={viewTransitionName}
	/>
{/if}

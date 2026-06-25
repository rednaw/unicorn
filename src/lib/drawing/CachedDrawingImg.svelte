<script lang="ts">
	import { cacheAsset } from '$lib/drawing/asset-cache';

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

	/** Warm session cache for atelier navigation — keep a stable HTTP src (no blob swap). */
	$effect(() => {
		void cacheAsset(url);
	});
</script>

<img
	class={className}
	src={url}
	{width}
	{height}
	{alt}
	{loading}
	decoding="async"
	style:view-transition-name={viewTransitionName}
/>

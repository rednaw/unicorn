<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { asset, resolve } from '$app/paths';
	import './layout.css';

	let { children } = $props();

	onMount(() => {
		if (!browser || !('serviceWorker' in navigator)) return;
		const root = resolve('/');
		const scope = root.endsWith('/') ? root : `${root}/`;
		navigator.serviceWorker.register(asset('/sw.js'), { scope }).catch(() => {});
	});
</script>

{@render children()}

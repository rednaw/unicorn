<script lang="ts">
	import { onMount } from 'svelte';
	import { createAtelierSession, type AtelierSession } from '$lib/atelier/atelier-session.svelte';
	import type { Drawing } from '$lib/content';

	let {
		drawings,
		onNavigateHome,
		ready
	}: {
		drawings: Drawing[];
		onNavigateHome: () => void;
		ready: (session: AtelierSession) => void;
	} = $props();

	onMount(() => {
		ready(createAtelierSession({ drawings, onNavigateHome }));
	});
</script>

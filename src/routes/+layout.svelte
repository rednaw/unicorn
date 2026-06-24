<script lang="ts">
	import './layout.css';
	import favicon32 from '$lib/assets/favicon-32.png';
	import favicon48 from '$lib/assets/favicon-48.png';
	import appleTouchIcon from '$lib/assets/apple-touch-icon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/png" sizes="32x32" href={favicon32} />
	<link rel="icon" type="image/png" sizes="48x48" href={favicon48} />
	<link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon} />
</svelte:head>

{@render children()}

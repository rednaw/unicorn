<script lang="ts">
	import './layout.css';
	import cormorant400 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2?url';
	import cormorant400italic from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2?url';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preload" href={cormorant400} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={cormorant400italic} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{@render children()}

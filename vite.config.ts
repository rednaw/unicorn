import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { serviceWorkerPlugin } from './scripts/service-worker.mjs';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), serviceWorkerPlugin()]
});

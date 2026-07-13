import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.ts'],
		environment: 'happy-dom',
		setupFiles: ['src/test/setup.ts']
	}
});

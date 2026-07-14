import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig as ViteUserConfig,
	defineConfig({
		test: {
			include: ['src/**/*.{test,spec}.ts'],
			environment: 'happy-dom',
			setupFiles: ['src/test/setup.ts'],
			coverage: {
				provider: 'v8',
				reporter: ['text', 'text-summary', 'html'],
				reportsDirectory: 'coverage',
				include: ['src/lib/**/*.{ts,svelte.ts}'],
				exclude: ['src/**/*.test.ts', 'src/test/**']
			}
		}
	})
);

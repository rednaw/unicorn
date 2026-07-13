import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig as ViteUserConfig,
	defineConfig({
		test: {
			include: ['src/**/*.{test,spec}.ts'],
			environment: 'happy-dom',
			setupFiles: ['src/test/setup.ts']
		}
	})
);

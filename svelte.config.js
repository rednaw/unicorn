import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		alias: {
			$test: 'src/test'
		},
		adapter: adapter({
			fallback: '404.html',
			strict: true
		}),
		paths: {
			base: process.env.BASE_PATH ?? ''
		},
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', 'https://scripts.simpleanalyticscdn.com'],
				// Svelte SSR event delegation: on*="this.__e=event" (nonces/hashes on script-src do not apply).
				'script-src-attr': [
					'unsafe-hashes',
					'sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I='
				],
				'worker-src': ['self'],
				// Svelte scoped styles + view transitions inject <style> blocks.
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'blob:', 'data:', 'https://queue.simpleanalyticscdn.com'],
				'media-src': ['self'],
				'font-src': ['self', 'data:'],
				'connect-src': [
					'self',
					'https://queue.simpleanalyticscdn.com',
					'https://scripts.simpleanalyticscdn.com'
				],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'upgrade-insecure-requests': true
			}
		}
	}
};

export default config;

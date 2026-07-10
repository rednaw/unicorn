import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { serviceWorkerPlugin } from './scripts/service-worker.mjs';

const SA_SCRIPT =
	/<script[\s\S]*?scripts\.simpleanalyticscdn\.com\/latest\.js[\s\S]*?<\/script>\s*/;

/** Strip Simple Analytics in dev — production builds keep the tag in app.html. */
function simpleAnalyticsDevPlugin() {
	return {
		name: 'simple-analytics-dev',
		transformIndexHtml: {
			order: 'pre',
			handler(html: string, ctx: { server?: unknown }) {
				if (!ctx.server) return html;
				return html.replace(SA_SCRIPT, '');
			}
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), simpleAnalyticsDevPlugin(), sveltekit(), serviceWorkerPlugin()]
});

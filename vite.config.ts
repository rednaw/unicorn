import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { serviceWorkerPlugin } from './scripts/service-worker.mjs';

const SA_SCRIPT =
	/<script[\s\S]*?scripts\.simpleanalyticscdn\.com\/latest\.js[\s\S]*?<\/script>\s*/;
const UMAMI_SCRIPT =
	/<script[\s\S]*?analytics\.rednaw\.nl\/script\.js[\s\S]*?<\/script>\s*/;

/** Strip analytics tags in dev — production builds keep them in app.html. */
function analyticsDevPlugin() {
	return {
		name: 'analytics-dev',
		transformIndexHtml: {
			order: 'pre' as const,
			handler(html: string, ctx: { server?: unknown }) {
				if (!ctx.server) return html;
				return html.replace(SA_SCRIPT, '').replace(UMAMI_SCRIPT, '');
			}
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), analyticsDevPlugin(), sveltekit(), serviceWorkerPlugin()]
});

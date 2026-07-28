import { defineConfig } from 'vite'
import { resolve } from 'path'

/**
 * Отдельный IIFE entry для paint-worker.
 * Собирать после основного бандла: `vite build --config vite.worker.config.ts`
 * (emptyOutDir: false, чтобы не стереть dist/).
 */
export default defineConfig({
	build: {
		emptyOutDir: false,
		lib: {
			entry: resolve(__dirname, 'src/worker/render-worker.ts'),
			name: 'CanvasifyRenderWorker',
			formats: ['iife'],
			fileName: () => 'canvasify-render-worker.js',
		},
	},
})

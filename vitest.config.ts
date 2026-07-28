import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const alias = {
	'@maxxam0n/canvasify-core': resolve(__dirname, 'packages/core/src/index.ts'),
	'@maxxam0n/canvasify-react': resolve(__dirname, 'packages/react/src/index.ts'),
	'@maxxam0n/canvasify-vue': resolve(__dirname, 'packages/vue/src/index.ts'),
}

export default defineConfig({
	resolve: { alias },
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json-summary'],
			reportsDirectory: 'coverage',
			thresholds: {
				statements: 80,
				branches: 70,
				functions: 80,
				lines: 80,
			},
			include: ['packages/*/src/**/*.{ts,tsx,vue}'],
			exclude: [
				'packages/*/src/**/*.test.{ts,tsx}',
				'packages/*/src/**/__tests__/**',
				'packages/*/src/**/*.d.ts',
				'packages/core/src/worker/render-worker.ts',
			],
		},
		projects: [
			{
				resolve: { alias },
				test: {
					name: 'core',
					include: ['packages/core/**/*.{test,spec}.ts'],
					environment: 'node',
				},
			},
			{
				plugins: [react()],
				resolve: { alias },
				test: {
					name: 'react',
					include: ['packages/react/**/*.{test,spec}.{ts,tsx}'],
					environment: 'jsdom',
				},
			},
			{
				plugins: [vue()],
				resolve: { alias },
				test: {
					name: 'vue',
					include: ['packages/vue/**/*.{test,spec}.{ts,tsx}'],
					environment: 'jsdom',
				},
			},
		],
	},
})

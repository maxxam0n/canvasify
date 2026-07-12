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

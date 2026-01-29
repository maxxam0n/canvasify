import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import checker from 'vite-plugin-checker'
import { resolve } from 'path'

export default defineConfig({
	plugins: [vue(), checker({ vueTsc: true })],
	resolve: {
		alias: {
			'@maxxam0n/canvasify-core': resolve(__dirname, '../../packages/core/src/index.ts'),
			'@maxxam0n/canvasify-vue': resolve(__dirname, '../../packages/vue/src/index.ts'),
		},
	},
	server: {
		port: 5174,
	},
})

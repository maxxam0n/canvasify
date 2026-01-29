import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import { resolve } from 'path'

export default defineConfig({
	plugins: [checker({ typescript: true })],
	resolve: {
		alias: {
			'@maxxam0n/canvasify-core': resolve(__dirname, '../../packages/core/src/index.ts'),
		},
	},
	server: {
		port: 5175,
	},
})

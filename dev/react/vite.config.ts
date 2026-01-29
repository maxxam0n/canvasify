import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import { resolve } from 'path'

export default defineConfig({
	plugins: [react(), checker({ typescript: true })],
	resolve: {
		alias: {
			'@maxxam0n/canvasify-core': resolve(__dirname, '../../packages/core/src/index.ts'),
			'@maxxam0n/canvasify-react': resolve(__dirname, '../../packages/react/src/index.ts'),
		},
	},
	server: {
		port: 5173,
	},
})

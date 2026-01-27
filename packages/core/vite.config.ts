import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
	plugins: [
		dts({
			tsconfigPath: './tsconfig.json',
			insertTypesEntry: true,
			rollupTypes: true,
		}),
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'CanvasifyCore',
			fileName: format => `canvasify-core.${format === 'es' ? 'es.js' : 'umd.cjs'}`,
		},
	},
})

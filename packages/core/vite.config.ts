import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'unplugin-dts/vite'

/** Основной lib-бандл (es + umd). */
export default defineConfig({
	plugins: [
		dts({
			tsconfigPath: './tsconfig.json',
			insertTypesEntry: true,
			bundleTypes: true,
			exclude: ['**/*.test.ts', '**/__tests__/**'],
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

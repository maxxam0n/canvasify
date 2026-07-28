import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'unplugin-dts/vite'

export default defineConfig({
	plugins: [
		vue(),
		dts({
			tsconfigPath: './tsconfig.build.json',
			insertTypesEntry: true,
			processor: 'vue',
			bundleTypes: true,
		}),
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'CanvasifyVue',
			fileName: format => `canvasify-vue.${format === 'es' ? 'es.js' : 'umd.cjs'}`,
		},
		rollupOptions: {
			external: ['vue', '@maxxam0n/canvasify-core'],
			output: {
				globals: {
					vue: 'Vue',
					'@maxxam0n/canvasify-core': 'CanvasifyCore',
				},
			},
		},
	},
})

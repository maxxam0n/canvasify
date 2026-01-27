import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
	plugins: [
		react(),
		dts({
			tsconfigPath: './tsconfig.build.json',
			insertTypesEntry: true,
			rollupTypes: false,
		}),
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'CanvasifyReact',
			fileName: format => `canvasify-react.${format === 'es' ? 'es.js' : 'umd.cjs'}`,
		},
		rollupOptions: {
			external: ['react', 'react-dom', 'react/jsx-runtime', '@maxxam0n/canvasify-core'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
					'react/jsx-runtime': 'jsxRuntime',
					'@maxxam0n/canvasify-core': 'CanvasifyCore',
				},
			},
		},
	},
})

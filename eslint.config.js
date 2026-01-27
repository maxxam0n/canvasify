import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import vue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
	globalIgnores(['dist', '**/dist/**']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [js.configs.recommended, tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
	},
	{
		files: ['packages/react/**/*.{ts,tsx}'],
		extends: [reactHooks.configs['recommended-latest'], reactRefresh.configs.vite],
	},
	...vue.configs['flat/recommended'].map(config => ({
		...config,
		files: ['packages/vue/**/*.vue'],
	})),
	{
		files: ['packages/vue/**/*.vue'],
		languageOptions: {
			parser: vueParser,
			parserOptions: {
				parser: tseslint.parser,
				ecmaVersion: 2020,
				sourceType: 'module',
				extraFileExtensions: ['.vue'],
			},
			globals: globals.browser,
		},
		rules: {
			'vue/multi-word-component-names': 'off',
			'vue/valid-template-root': 'off',
			'vue/max-attributes-per-line': [
				'error',
				{
					singleline: { max: 3 },
					multiline: { max: 1 },
				},
			],
		},
	},
	eslintConfigPrettier,
])

import { defineConfig, devices } from '@playwright/test'

const reactDevServerUrl = 'http://127.0.0.1:5173'
const vueDevServerUrl = 'http://127.0.0.1:5174'
const coreDevServerUrl = 'http://127.0.0.1:5175'

export default defineConfig({
	testDir: './e2e',
	tsconfig: './e2e/tsconfig.json',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'list',
	use: {
		baseURL: vueDevServerUrl,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: [
		{
			command: 'npm run dev --workspace=dev-react -- --host 127.0.0.1 --strictPort',
			url: reactDevServerUrl,
			name: 'React playground',
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
		{
			command: 'npm run dev --workspace=dev-vue -- --host 127.0.0.1 --strictPort',
			url: vueDevServerUrl,
			name: 'Vue playground',
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
		{
			command: 'npm run dev --workspace=dev-core -- --host 127.0.0.1 --strictPort',
			url: coreDevServerUrl,
			name: 'Core playground',
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
	],
})

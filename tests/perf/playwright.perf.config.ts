import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: '.',
	timeout: 30_000,
	retries: 0,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:1420',
		headless: true,
		viewport: { width: 1920, height: 1080 },
	},
	projects: [
		{
			name: 'dev',
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'http://localhost:1420',
			},
		},
		{
			name: 'preview',
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'http://localhost:4173',
			},
		},
	],
});

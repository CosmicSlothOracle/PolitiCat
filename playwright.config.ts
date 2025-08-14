import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }
	],
	timeout: 60000,
	use: { trace: 'on-first-retry' },
});



import { test, expect, chromium, Page } from '@playwright/test';

async function openConsoleCapture(page: Page, tag: string) {
	page.on('console', msg => {
		// eslint-disable-next-line no-console
		console.log(`[${tag}][console:${msg.type()}]`, msg.text());
	});
	page.on('pageerror', err => {
		// eslint-disable-next-line no-console
		console.log(`[${tag}][pageerror]`, err.message);
	});
}

test('Matchmaking host/guest sync smoke', async () => {
	const browser = await chromium.launch();
	const ctx1 = await browser.newContext();
	const ctx2 = await browser.newContext();
	const host = await ctx1.newPage();
	const guest = await ctx2.newPage();
	await openConsoleCapture(host, 'HOST');
	await openConsoleCapture(guest, 'GUEST');

	await host.goto('https://politicat.netlify.app/pokemonz-online');
	await host.getByRole('button', { name: 'Create' }).click();
	await host.waitForTimeout(1000);
	const room = await host.locator('.room-code').first().innerText();
	// eslint-disable-next-line no-console
	console.log(`[ROOM] ${room}`);

	await guest.goto('https://politicat.netlify.app/pokemonz-online');
	await guest.getByLabel('Room Code:').fill(room);
	await guest.getByRole('button', { name: 'Join' }).click();
	await guest.waitForTimeout(2000);

	// Host should see guest connected in slot 2
	await expect(host.locator('.mm-slots .mm-slot').nth(1)).toContainText('Connected');
	// Guest should see host connected in slot 1
	await expect(guest.locator('.mm-slots .mm-slot').first()).toContainText('Connected');

	// Only host can press Start
	await host.getByRole('button', { name: 'Start' }).click();
	await host.waitForTimeout(1000);

	// Guest modal should close automatically after start
	await expect(guest.locator('.matchmaking-modal')).toHaveCount(0);

	await browser.close();
});



import { browser, $, $$ } from '@wdio/globals';

const USER_SCOPE_ONLY_LABELS = ['General', 'Account', 'Keyboard Shortcuts', 'Language'];
const WORKSPACE_SCOPE_ONLY_LABELS = ['Workspace'];
const SHARED_CATEGORY_LABELS = ['Appearance', 'Issue Cards', 'Notifications', 'AI Configuration'];

function navLink(label: string): string {
	return `//nav//a[normalize-space()="${label}"]`;
}

async function waitForSettingsUrl(path: string): Promise<void> {
	await browser.waitUntil(async () => (await browser.getUrl()).includes(path), {
		timeout: 15_000,
		timeoutMsg: `Expected URL to contain ${path}`,
	});
	const backButton = await $('[data-testid="settings-back-button"]');
	await backButton.waitForDisplayed({ timeout: 15_000 });
}

describe('Settings Shell — redirect', () => {
	it('should redirect /settings to /settings/general', async () => {
		await browser.url('/settings');
		await waitForSettingsUrl('/settings/general');
		expect(await browser.getUrl()).toContain('/settings/general');
	});
});

describe('Settings Shell — category navigation', () => {
	before(async () => {
		await browser.url('/settings/general');
		await waitForSettingsUrl('/settings/general');
	});

	it('should navigate to Appearance and highlight the active nav item', async () => {
		const link = await $(navLink('Appearance'));
		await link.waitForDisplayed({ timeout: 5000 });
		await link.click();
		await waitForSettingsUrl('/settings/appearance');

		const activeLink = await $('nav a.is-active');
		expect(await activeLink.getText()).toContain('Appearance');
		expect(await activeLink.getAttribute('aria-current')).toBe('page');
	});

	it('should navigate to Issue Cards and highlight the active nav item', async () => {
		const link = await $(navLink('Issue Cards'));
		await link.waitForDisplayed({ timeout: 5000 });
		await link.click();
		await waitForSettingsUrl('/settings/issue-cards');

		const activeLink = await $('nav a.is-active');
		expect(await activeLink.getText()).toContain('Issue Cards');
	});

	it('should navigate to AI Configuration and highlight the active nav item', async () => {
		const link = await $(navLink('AI Configuration'));
		await link.waitForDisplayed({ timeout: 5000 });
		await link.click();
		await waitForSettingsUrl('/settings/ai-config');

		const activeLink = await $('nav a.is-active');
		expect(await activeLink.getText()).toContain('AI Configuration');
	});

	it('should navigate back to General and highlight the active nav item', async () => {
		const link = await $(navLink('General'));
		await link.waitForDisplayed({ timeout: 5000 });
		await link.click();
		await waitForSettingsUrl('/settings/general');

		const activeLink = await $('nav a.is-active');
		expect(await activeLink.getText()).toContain('General');
	});
});

describe('Settings Shell — Notifications subcategories', () => {
	it('should show nested subcategory links when Notifications is active', async () => {
		await browser.url('/settings/notifications/events');
		await waitForSettingsUrl('/settings/notifications');

		for (const label of ['Events', 'Sound Packs', 'Characters']) {
			const link = await $(navLink(label));
			await link.waitForExist({ timeout: 10_000 });
			expect(await link.isDisplayed()).toBe(true);
		}
	});
});

describe('Settings Shell — user scope categories', () => {
	before(async () => {
		await browser.url('/settings/general');
		await waitForSettingsUrl('/settings/general');
	});

	for (const label of [...USER_SCOPE_ONLY_LABELS, ...SHARED_CATEGORY_LABELS]) {
		it(`should show "${label}" in user scope`, async () => {
			const link = await $(navLink(label));
			await link.waitForExist({ timeout: 5000 });
			expect(await link.isDisplayed()).toBe(true);
		});
	}

	it('should NOT show Workspace category in user scope', async () => {
		const workspaceLinks = await $$(navLink('Workspace'));
		expect(workspaceLinks.length).toBe(0);
	});
});

describe('Settings Shell — scope switcher visibility', () => {
	it('scope switcher is hidden when no workspace query params present', async () => {
		await browser.url('/settings/general');
		await waitForSettingsUrl('/settings/general');

		const switcher = await $('[data-testid="settings-scope-switcher"]');
		expect(await switcher.isExisting()).toBe(false);
	});

	it('scope switcher is visible when workspace query params are present', async () => {
		await browser.url('/settings/appearance?scope=ws&id=test-dashboard-id');
		await waitForSettingsUrl('/settings/appearance');

		const switcher = await $('[data-testid="settings-scope-switcher"]');
		await switcher.waitForDisplayed({ timeout: 5000 });
		expect(await switcher.isDisplayed()).toBe(true);
	});
});

describe('Settings Shell — workspace scope categories', () => {
	before(async () => {
		await browser.url('/settings/appearance?scope=ws&id=test-dashboard-id');
		await waitForSettingsUrl('/settings/appearance');
	});

	for (const label of [...WORKSPACE_SCOPE_ONLY_LABELS, ...SHARED_CATEGORY_LABELS]) {
		it(`should show "${label}" in workspace scope`, async () => {
			const link = await $(navLink(label));
			await link.waitForExist({ timeout: 5000 });
			expect(await link.isDisplayed()).toBe(true);
		});
	}

	for (const label of USER_SCOPE_ONLY_LABELS) {
		it(`should NOT show "${label}" in workspace scope`, async () => {
			const links = await $$(navLink(label));
			expect(links.length).toBe(0);
		});
	}
});

describe('Settings Shell — workspace banner', () => {
	it('banner is absent when dashboard id does not resolve to a real workspace', async () => {
		await browser.url('/settings/appearance?scope=ws&id=nonexistent-dashboard');
		await waitForSettingsUrl('/settings/appearance');

		const banner = await $('[data-testid="settings-workspace-banner"]');
		expect(await banner.isExisting()).toBe(false);
	});
});

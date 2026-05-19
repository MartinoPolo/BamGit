import { browser, $ } from '@wdio/globals';

async function navigateToSettings(path: string): Promise<void> {
	await browser.url(path);
	await browser.waitUntil(async () => (await browser.getUrl()).includes(path), {
		timeout: 15_000,
		timeoutMsg: `Expected URL to contain ${path}`,
	});
	const sidebar = await $('[data-testid="settings-back-button"]');
	await sidebar.waitForDisplayed({ timeout: 15_000 });
	await waitForSettingsLoaded();
}

async function waitForSettingsLoaded(): Promise<void> {
	const activeTab = await $('button[role="tab"][aria-selected="true"]');
	await activeTab.waitForExist({
		timeout: 15_000,
		timeoutMsg: 'Settings did not load (no active tab found)',
	});
}

function tabByText(text: string): string {
	return `//button[@role="tab" and contains(., "${text}")]`;
}

async function waitForTabActive(text: string): Promise<void> {
	await browser.waitUntil(
		async () => {
			const tab = await $(tabByText(text));
			return (await tab.getAttribute('aria-selected')) === 'true';
		},
		{ timeout: 15_000, timeoutMsg: `Expected "${text}" tab to become active` },
	);
}

describe('Settings Persistence — theme mode', () => {
	it('should persist theme mode after navigating away and back', async () => {
		await navigateToSettings('/settings/appearance');

		const darkTab = await $(tabByText('Dark'));
		await darkTab.waitForDisplayed({ timeout: 10_000 });
		await darkTab.click();
		await waitForTabActive('Dark');

		await navigateToSettings('/settings/general');
		await navigateToSettings('/settings/appearance');
		await waitForTabActive('Dark');

		// Restore to System
		const systemTab = await $(tabByText('System'));
		await systemTab.waitForDisplayed({ timeout: 5000 });
		await systemTab.click();
	});
});

describe('Settings Persistence — startup behavior', () => {
	it('should persist startup behavior after navigating away and back', async () => {
		await navigateToSettings('/settings/general');

		const lastWorkspaceTab = await $(tabByText('Last Workspace'));
		await lastWorkspaceTab.waitForDisplayed({ timeout: 10_000 });
		await lastWorkspaceTab.click();
		await waitForTabActive('Last Workspace');

		await navigateToSettings('/settings/appearance');
		await navigateToSettings('/settings/general');
		await waitForTabActive('Last Workspace');

		// Restore to Overview
		const overviewTab = await $(tabByText('Overview'));
		await overviewTab.waitForDisplayed({ timeout: 5000 });
		await overviewTab.click();
	});
});

describe('Settings Persistence — accent color', () => {
	it('should update selected state when a different accent color is clicked', async () => {
		await navigateToSettings('/settings/appearance');

		// Find the section that contains the "Accent" heading
		const accentSection = await $('//section[.//h2[contains(., "Accent")]]');
		await accentSection.waitForExist({ timeout: 10_000 });

		// Scope accent buttons to only the accent section
		const initiallySelected = await accentSection.$('button.border-primary');
		const initialText = await initiallySelected.getText();

		const accentButtons = await accentSection.$$('button');
		expect(accentButtons.length).toBeGreaterThan(1);

		let clicked = false;
		for (const button of accentButtons) {
			const classes = await button.getAttribute('class');
			if (classes !== null && classes.includes('border-primary') === false) {
				await button.click();
				clicked = true;
				break;
			}
		}
		expect(clicked).toBe(true);

		await browser.waitUntil(
			async () => {
				const selected = await accentSection.$('button.border-primary');
				const text = await selected.getText();
				return text !== initialText;
			},
			{ timeout: 10_000, timeoutMsg: 'Expected accent color selection to change' },
		);

		const newlySelected = await accentSection.$('button.border-primary');
		const newText = await newlySelected.getText();
		expect(newText).not.toBe(initialText);
	});
});

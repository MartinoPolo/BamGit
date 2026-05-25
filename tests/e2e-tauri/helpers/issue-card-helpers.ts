import { browser, $, $$ } from '@wdio/globals';

export async function navigateToWorkspace(): Promise<void> {
	await browser.url('/');
	const card = await $('[data-testid="issue-card"]');
	await card.waitForDisplayed({
		timeout: 30_000,
		timeoutMsg: 'No issue cards rendered on workspace',
	});
}

export async function findCardByTitle(titleText: string): Promise<WebdriverIO.Element> {
	const cards = await $$('[data-testid="issue-card"]');
	for (const card of cards) {
		const text = await card.getText();
		if (text.includes(titleText)) {
			return card;
		}
	}
	throw new Error(`Card with title "${titleText}" not found`);
}

export async function getChipLabel(card: WebdriverIO.Element): Promise<string | null> {
	const chip = await card.$('[role="status"]');
	if (!(await chip.isExisting())) {
		return null;
	}
	return chip.getAttribute('aria-label');
}

export async function getActionButtonLabels(card: WebdriverIO.Element): Promise<string[]> {
	const buttons = await card.$$('button');
	const labels: string[] = [];
	for (const btn of buttons) {
		const text = await btn.getText();
		if (text && text.trim()) {
			labels.push(text.trim());
		}
	}
	return labels;
}

export async function getComputedStyleProperty(
	element: WebdriverIO.Element,
	property: string,
): Promise<string> {
	return browser.execute(
		(el: HTMLElement, prop: string) => window.getComputedStyle(el).getPropertyValue(prop),
		element as unknown as HTMLElement,
		property,
	);
}

export async function navigateToIssueCardSettings(): Promise<void> {
	await browser.url('/settings/issue-cards');
	await browser.waitUntil(
		async () => (await browser.getUrl()).includes('/settings/issue-cards'),
		{ timeout: 15_000, timeoutMsg: 'Expected URL to contain /settings/issue-cards' },
	);
	const backButton = await $('[data-testid="settings-back-button"]');
	await backButton.waitForDisplayed({
		timeout: 15_000,
		timeoutMsg: 'Settings back button not displayed on issue-cards page',
	});
}

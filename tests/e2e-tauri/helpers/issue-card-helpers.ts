import { browser, $, $$ } from '@wdio/globals';

export async function navigateToWorkspace(): Promise<void> {
	const cardCount: number = await browser.execute(
		'return document.querySelectorAll(\'[data-testid="issue-card"]\').length',
	);

	if (cardCount === 0) {
		// After seed_demo_workspace in wdio.conf before hook, trigger store reload
		// to pick up the new dashboard. This avoids a page reload which kills WebDriver.
		await browser.execute(
			'return (async function(){' +
				'if(window.__E2E_RELOAD_STORES__){' +
				'await window.__E2E_RELOAD_STORES__("demo-forest-workspace");' +
				'}' +
				'})()',
		);
		await browser.pause(1000);
		// The app opens at /overview — click first sidebar nav item to go to workspace page
		const firstNavLink = await $('nav a[href="/"]');
		if (await firstNavLink.isExisting()) {
			await firstNavLink.click();
		} else {
			// Fallback: use browser.url which does a WebDriver navigation
			await browser.url('/');
		}
		await browser.pause(3000);
	}

	await browser.waitUntil(
		async () => {
			const cards = await $$('[data-testid="issue-card"]');
			return cards.length > 0;
		},
		{
			timeout: 30_000,
			interval: 2000,
			timeoutMsg: 'No issue cards rendered on workspace after 30s',
		},
	);
}

export async function findCardByTitle(titleText: string): Promise<WebdriverIO.Element> {
	const cards = await $$('[data-testid="issue-card"]');
	const foundTexts: string[] = [];
	for (const card of cards) {
		const text: string = await browser.execute(
			(el: HTMLElement) =>
				el.querySelector('[data-testid="issue-card-title"]')?.textContent ??
				el.textContent ??
				'',
			card as unknown as HTMLElement,
		);
		foundTexts.push(text.substring(0, 40));
		if (text.includes(titleText)) {
			return card;
		}
	}
	throw new Error(
		`Card with title "${titleText}" not found among ${cards.length} cards. ` +
			`Found: [${foundTexts.join(' | ')}]`,
	);
}

export async function getChipLabel(card: WebdriverIO.Element): Promise<string | null> {
	return browser.execute(
		(el: HTMLElement) => {
			const chip = el.querySelector('[role="status"]');
			if (!chip) {
				return null;
			}
			return chip.getAttribute('aria-label');
		},
		card as unknown as HTMLElement,
	);
}

export async function getActionButtonLabels(card: WebdriverIO.Element): Promise<string[]> {
	return browser.execute(
		(el: HTMLElement) => {
			const actionContainer = el.querySelector('[data-testid="issue-card-actions"]');
			if (!actionContainer) {
				return [];
			}
			const buttons = actionContainer.querySelectorAll('button');
			const labels: string[] = [];
			for (const btn of buttons) {
				const text = btn.textContent?.trim();
				if (text) {
					labels.push(text);
				}
			}
			return labels;
		},
		card as unknown as HTMLElement,
	);
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

export async function getPrimaryActionLabel(card: WebdriverIO.Element): Promise<string | null> {
	const buttons = await getActionButtonLabels(card);
	return buttons.length > 0 ? buttons[0] : null;
}

export async function getSecondaryActionLabel(card: WebdriverIO.Element): Promise<string | null> {
	const buttons = await getActionButtonLabels(card);
	return buttons.length > 1 ? buttons[1] : null;
}

export async function getQuickActionButtons(
	card: WebdriverIO.Element,
): Promise<WebdriverIO.Element[]> {
	const folderButton = await card.$('button[aria-label="Open folder"]');
	if (!(await folderButton.isExisting())) {
		return [];
	}
	const buttons: WebdriverIO.Element[] = [folderButton];
	const terminalButton = await card.$('button[aria-label="Open terminal"]');
	if (await terminalButton.isExisting()) {
		buttons.push(terminalButton);
	}
	const editorButton = await card.$('button[aria-label="Open editor"]');
	if (await editorButton.isExisting()) {
		buttons.push(editorButton);
	}
	return buttons;
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

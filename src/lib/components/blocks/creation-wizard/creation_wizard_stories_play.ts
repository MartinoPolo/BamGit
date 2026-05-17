import { expect, userEvent, waitFor, within } from 'storybook/test';

/** Dialog is portaled to <body>, so we must query the document directly. */
function getDialog(): HTMLElement | null {
	return document.querySelector('[role="dialog"]');
}

function getVisibleDialog(): HTMLElement {
	const dialog = getDialog();
	if (dialog === null) {
		throw new Error('dialog not found in document');
	}
	return dialog;
}

function getCommandInput(dialog: HTMLElement): HTMLInputElement | null {
	return dialog.querySelector('[data-command-input]') as HTMLInputElement | null;
}

export const playOpensAtStep1 = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const dialog = getVisibleDialog();
	const dialogCanvas = within(dialog);
	await expect(dialog).toBeVisible();
	await expect(dialogCanvas.getByText('Search GitHub Issues')).toBeVisible();
	const input = getCommandInput(dialog);
	await expect(input).toBeInTheDocument();
	await expect(canvasElement.children.length).toBeGreaterThan(0);
};

export const playSearchListVisible = async () => {
	const dialog = getVisibleDialog();
	const dialogCanvas = within(dialog);
	await expect(dialog).toBeVisible();
	await expect(dialogCanvas.getByText(/Refactor auth middleware/)).toBeVisible();
	await expect(dialogCanvas.getByText(/Implement dark mode toggle/)).toBeVisible();
};

export const playEnterAdvancesToStep2 = async () => {
	const dialog = getVisibleDialog();
	const dialogCanvas = within(dialog);
	await expect(dialog).toBeVisible();

	const input = getCommandInput(dialog);
	await waitFor(() => expect(input).toHaveFocus());

	await waitFor(() => {
		const items = dialog.querySelectorAll('[data-command-item]');
		expect(items.length).toBeGreaterThan(0);
		expect(items[0]).toHaveAttribute('data-selected');
	});

	await userEvent.keyboard('{Enter}');
	await waitFor(() => expect(dialogCanvas.getByText('Issue Name')).toBeVisible());
	await expect(dialogCanvas.getByPlaceholderText('Issue name')).toBeVisible();
};

export const playBackspaceGoesBack = async () => {
	const dialog = getVisibleDialog();
	const dialogCanvas = within(dialog);
	await expect(dialog).toBeVisible();
	await expect(dialogCanvas.getByText('Issue Name')).toBeVisible();

	const input = dialogCanvas.getByPlaceholderText('Issue name') as HTMLInputElement;
	input.blur();
	window.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
	);
	await waitFor(() => expect(dialogCanvas.getByText('Search GitHub Issues')).toBeVisible());
};

export const playEscapeContainment = async () => {
	const dialog = getVisibleDialog();
	await expect(dialog).toBeVisible();

	let capturedEvent: KeyboardEvent | null = null;
	const captureEscapeSpy = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			capturedEvent = event;
		}
	};
	document.addEventListener('keydown', captureEscapeSpy);

	try {
		await userEvent.keyboard('{Escape}');
		await waitFor(() => {
			const d = getDialog();
			expect(d === null || d?.dataset.state === 'closed').toBe(true);
		});
		await expect(capturedEvent).not.toBeNull();
		await expect(capturedEvent!.defaultPrevented).toBe(true);
	} finally {
		document.removeEventListener('keydown', captureEscapeSpy);
	}
};

export const playEscapeFromStep2 = async () => {
	const dialog = getVisibleDialog();
	const dialogCanvas = within(dialog);
	await expect(dialog).toBeVisible();
	await expect(dialogCanvas.getByText('Issue Name')).toBeVisible();

	let capturedEvent: KeyboardEvent | null = null;
	const captureEscapeSpy = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			capturedEvent = event;
		}
	};
	document.addEventListener('keydown', captureEscapeSpy);

	try {
		capturedEvent = null;
		await userEvent.keyboard('{Escape}');
		await expect(dialog).toBeVisible();
		await expect(dialogCanvas.getByText('Search GitHub Issues')).toBeVisible();
		await expect(capturedEvent).not.toBeNull();
		await expect(capturedEvent!.defaultPrevented).toBe(true);

		capturedEvent = null;
		await userEvent.keyboard('{Escape}');
		await waitFor(() => {
			const d = getDialog();
			expect(d === null || d?.dataset.state === 'closed').toBe(true);
		});
		await expect(capturedEvent).not.toBeNull();
		await expect(capturedEvent!.defaultPrevented).toBe(true);
	} finally {
		document.removeEventListener('keydown', captureEscapeSpy);
	}
};

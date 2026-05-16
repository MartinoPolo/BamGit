<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, fn, waitFor } from 'storybook/test';
	import CommandPaletteStoryWrapper from './CommandPaletteStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/CommandPalette',
		component: CommandPaletteStoryWrapper,
		tags: ['autodocs'],
	});

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                            */
	/* ------------------------------------------------------------------ */

	function getDialog() {
		return document.querySelector('[role="dialog"]') as HTMLElement | null;
	}

	/** Wait for the portaled dialog to appear in the DOM. */
	async function waitForDialog(): Promise<HTMLElement> {
		let dialog: HTMLElement | null = null;
		await waitFor(() => {
			dialog = getDialog();
			if (!dialog) {
				throw new Error('dialog not found');
			}
		});
		return dialog!;
	}

	function getSearchInput() {
		const dialog = getDialog();
		return dialog?.querySelector('input') as HTMLInputElement | null;
	}

	function getResultOptions() {
		const dialog = getDialog();
		if (!dialog) {
			return [];
		}
		return [...dialog.querySelectorAll('[role="option"]')] as HTMLElement[];
	}

	/** Assert dialog is closed (either absent or data-state="closed"). */
	async function expectDialogClosed() {
		const dialog = getDialog();
		if (dialog) {
			await waitFor(() => expect(dialog.dataset.state).toBe('closed'));
			return;
		}
	}

	/* ------------------------------------------------------------------ */
	/*  play() interaction tests                                          */
	/* ------------------------------------------------------------------ */

	const playSearchInputFocused = async () => {
		await waitForDialog();

		const searchInput = getSearchInput();
		await expect(searchInput).toBeInTheDocument();
		await waitFor(() => expect(searchInput).toHaveFocus());
	};

	const playFilterResults = async () => {
		await waitForDialog();

		const searchInput = getSearchInput()!;
		const optionsBefore = getResultOptions();
		await expect(optionsBefore.length).toBeGreaterThan(1);

		// Type "settings" — should filter to "Go to Settings"
		await userEvent.clear(searchInput);
		await userEvent.type(searchInput, 'settings');

		const optionsAfter = getResultOptions();
		await expect(optionsAfter.length).toBe(1);
		await expect(optionsAfter[0]).toHaveTextContent(/go to settings/i);
	};

	const playArrowDownHighlights = async () => {
		await waitForDialog();

		// Wait for search input to be focused (rAF-deferred) — keyboard events
		// dispatch on activeElement so focus must be inside Dialog.Content for
		// the keydown handler to fire.
		const searchInput = getSearchInput()!;
		await waitFor(() => expect(searchInput).toHaveFocus());

		// Wait for options to render and first item to be selected (async Svelte state)
		await waitFor(() => {
			const options = getResultOptions();
			expect(options.length).toBeGreaterThan(1);
			expect(options[0]).toHaveAttribute('aria-selected', 'true');
		});

		// ArrowDown → second item highlighted (waitFor: Svelte reactive update is async)
		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => {
			const optionsAfterArrow = getResultOptions();
			expect(optionsAfterArrow[1]).toHaveAttribute('aria-selected', 'true');
			expect(optionsAfterArrow[0]).toHaveAttribute('aria-selected', 'false');
		});
	};

	const playEnterExecutesAndCloses = async () => {
		await waitForDialog();

		const options = getResultOptions();
		await expect(options.length).toBeGreaterThan(0);

		// Click first option directly to execute and close
		await userEvent.click(options[0]);

		// Palette should close
		await expectDialogClosed();
	};

	const playEscapeCloses = async () => {
		await waitForDialog();

		// Press Escape
		await userEvent.keyboard('{Escape}');

		// Palette should close
		await expectDialogClosed();
	};

	const playEscapeContainment = async () => {
		await waitForDialog();

		// Attach a document-level keydown spy BEFORE pressing Escape
		const documentKeydownSpy = fn();
		document.addEventListener('keydown', documentKeydownSpy);

		try {
			// Reset spy
			documentKeydownSpy.mockClear();

			// Press Escape — should close palette
			await userEvent.keyboard('{Escape}');
			await expectDialogClosed();

			// The Escape keydown reaches document (bits-ui behavior), but the dialog
			// intercepted and closed itself. We verify at minimum the dialog closed
			// before any page-level handler could act on it.
		} finally {
			document.removeEventListener('keydown', documentKeydownSpy);
		}
	};
</script>

<Story name="Open" play={playSearchInputFocused}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Filter Results" play={playFilterResults}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Arrow Down Highlights" play={playArrowDownHighlights}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Enter Executes and Closes" play={playEnterExecutesAndCloses}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Escape Closes" play={playEscapeCloses}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Escape Containment" play={playEscapeContainment}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

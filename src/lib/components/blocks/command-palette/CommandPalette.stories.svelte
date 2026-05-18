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

	function getCommandInput() {
		const dialog = getDialog();
		return dialog?.querySelector('[data-command-input]') as HTMLInputElement | null;
	}

	function getCommandItems() {
		const dialog = getDialog();
		if (!dialog) {
			return [];
		}
		return [...dialog.querySelectorAll('[data-command-item]')] as HTMLElement[];
	}

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

		const searchInput = getCommandInput();
		await expect(searchInput).toBeInTheDocument();
		await waitFor(() => expect(searchInput).toHaveFocus());
	};

	const playFilterResults = async () => {
		await waitForDialog();

		const searchInput = getCommandInput()!;
		await waitFor(() => {
			const items = getCommandItems();
			expect(items.length).toBeGreaterThan(1);
		});

		await userEvent.clear(searchInput);
		await userEvent.type(searchInput, 'settings');

		await waitFor(() => {
			const optionsAfter = getCommandItems();
			expect(optionsAfter.length).toBe(1);
			expect(optionsAfter[0]).toHaveTextContent(/go to settings/i);
		});
	};

	const playArrowDownHighlights = async () => {
		await waitForDialog();

		const searchInput = getCommandInput()!;
		await waitFor(() => expect(searchInput).toHaveFocus());

		await waitFor(() => {
			const items = getCommandItems();
			expect(items.length).toBeGreaterThan(1);
			expect(items[0]).toHaveAttribute('data-selected');
		});

		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => {
			const items = getCommandItems();
			expect(items[1]).toHaveAttribute('data-selected');
			expect(items[0]).not.toHaveAttribute('data-selected');
		});
	};

	const playEnterExecutesAndCloses = async () => {
		await waitForDialog();

		await waitFor(() => {
			const items = getCommandItems();
			expect(items.length).toBeGreaterThan(0);
		});

		const items = getCommandItems();
		items[0].click();

		await expectDialogClosed();
	};

	const playEscapeCloses = async () => {
		await waitForDialog();

		await userEvent.keyboard('{Escape}');

		await expectDialogClosed();
	};

	const playEscapeContainment = async () => {
		await waitForDialog();

		const documentKeydownSpy = fn();
		document.addEventListener('keydown', documentKeydownSpy);

		try {
			documentKeydownSpy.mockClear();

			await userEvent.keyboard('{Escape}');
			await expectDialogClosed();
		} finally {
			document.removeEventListener('keydown', documentKeydownSpy);
		}
	};
</script>

<Story name="Open [play: search input focused]" play={playSearchInputFocused}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Filter Results [play: filter results]" play={playFilterResults}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Arrow Down Highlights [play: arrow highlights item]" play={playArrowDownHighlights}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Enter Executes and Closes [play: enter executes closes]"
	play={playEnterExecutesAndCloses}
>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Escape Closes [play: escape closes palette]" play={playEscapeCloses}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Escape Containment [play: escape contained]" play={playEscapeContainment}>
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

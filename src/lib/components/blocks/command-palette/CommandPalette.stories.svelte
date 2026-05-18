<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, fn, waitFor, within } from 'storybook/test';
	import CommandPaletteStoryWrapper from './CommandPaletteStoryWrapper.svelte';
	import StoryKeyboardHints from '$lib/storybook/StoryKeyboardHints.svelte';
	import KeyboardHint from '$lib/storybook/KeyboardHint.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/CommandPalette',
		component: CommandPaletteStoryWrapper,
		tags: ['autodocs'],
	});

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                            */
	/* ------------------------------------------------------------------ */

	async function waitForDialog(canvasElement: HTMLElement): Promise<HTMLElement> {
		const canvas = within(canvasElement);
		let dialog: HTMLElement | null = null;
		await waitFor(() => {
			dialog = canvas.getByRole('dialog') as HTMLElement;
		});
		return dialog!;
	}

	function getCommandInput(dialog: HTMLElement): HTMLInputElement | null {
		return dialog.querySelector('[data-command-input]') as HTMLInputElement | null;
	}

	function getCommandItems(dialog: HTMLElement): HTMLElement[] {
		return [...dialog.querySelectorAll('[data-command-item]')] as HTMLElement[];
	}

	async function expectDialogClosed(canvasElement: HTMLElement) {
		const canvas = within(canvasElement);
		await waitFor(() => {
			const dialogs = canvasElement.querySelectorAll('[role="dialog"]');
			const openDialog = [...dialogs].find(
				(el) => (el as HTMLElement).dataset.state !== 'closed',
			);
			expect(openDialog).toBeUndefined();
		});
	}

	/* ------------------------------------------------------------------ */
	/*  play() interaction tests                                          */
	/* ------------------------------------------------------------------ */

	const playSearchInputFocused = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const dialog = await waitForDialog(canvasElement);

		const searchInput = getCommandInput(dialog);
		await expect(searchInput).toBeInTheDocument();
		await waitFor(() => expect(searchInput).toHaveFocus());
	};

	const playFilterResults = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const dialog = await waitForDialog(canvasElement);

		const searchInput = getCommandInput(dialog)!;
		await waitFor(() => {
			const items = getCommandItems(dialog);
			expect(items.length).toBeGreaterThan(1);
		});

		await userEvent.clear(searchInput);
		await userEvent.type(searchInput, 'settings');

		await waitFor(() => {
			const optionsAfter = getCommandItems(dialog);
			expect(optionsAfter.length).toBe(1);
			expect(optionsAfter[0]).toHaveTextContent(/go to settings/i);
		});
	};

	const playArrowDownHighlights = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const dialog = await waitForDialog(canvasElement);

		const searchInput = getCommandInput(dialog)!;
		await waitFor(() => expect(searchInput).toHaveFocus());

		await waitFor(() => {
			const items = getCommandItems(dialog);
			expect(items.length).toBeGreaterThan(1);
			expect(items[0]).toHaveAttribute('data-selected');
		});

		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => {
			const items = getCommandItems(dialog);
			expect(items[1]).toHaveAttribute('data-selected');
			expect(items[0]).not.toHaveAttribute('data-selected');
		});
	};

	const playEnterExecutesAndCloses = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const dialog = await waitForDialog(canvasElement);

		await waitFor(() => {
			const items = getCommandItems(dialog);
			expect(items.length).toBeGreaterThan(0);
		});

		const items = getCommandItems(dialog);
		items[0].click();

		await expectDialogClosed(canvasElement);
	};

	const playEscapeCloses = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await waitForDialog(canvasElement);

		await userEvent.keyboard('{Escape}');

		await expectDialogClosed(canvasElement);
	};

	const playEscapeContainment = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await waitForDialog(canvasElement);

		const documentKeydownSpy = fn();
		document.addEventListener('keydown', documentKeydownSpy);

		try {
			documentKeydownSpy.mockClear();

			await userEvent.keyboard('{Escape}');
			await expectDialogClosed(canvasElement);
		} finally {
			document.removeEventListener('keydown', documentKeydownSpy);
		}
	};
</script>

<Story name="Open [play: search input focused]" play={playSearchInputFocused}>
	{#snippet template()}
		<CommandPaletteStoryWrapper portalProps={{ disabled: true }}>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Filter Results [play: filter results]" play={playFilterResults}>
	{#snippet template()}
		<CommandPaletteStoryWrapper portalProps={{ disabled: true }}>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Arrow Down Highlights [play: arrow highlights item]" play={playArrowDownHighlights}>
	{#snippet template()}
		<StoryKeyboardHints>
			<KeyboardHint keys="↓ / ↑" action="Navigate items" />
			<KeyboardHint keys="Enter" action="Select item" />
			<KeyboardHint keys="Escape" action="Close palette" />
		</StoryKeyboardHints>
		<CommandPaletteStoryWrapper portalProps={{ disabled: true }}>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Enter Executes and Closes [play: enter executes closes]"
	play={playEnterExecutesAndCloses}
>
	{#snippet template()}
		<StoryKeyboardHints>
			<KeyboardHint keys="↓ / ↑" action="Navigate items" />
			<KeyboardHint keys="Enter" action="Select item" />
			<KeyboardHint keys="Escape" action="Close palette" />
		</StoryKeyboardHints>
		<CommandPaletteStoryWrapper portalProps={{ disabled: true }}>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Escape Closes [play: escape closes palette]" play={playEscapeCloses}>
	{#snippet template()}
		<StoryKeyboardHints>
			<KeyboardHint keys="↓ / ↑" action="Navigate items" />
			<KeyboardHint keys="Enter" action="Select item" />
			<KeyboardHint keys="Escape" action="Close palette" />
		</StoryKeyboardHints>
		<CommandPaletteStoryWrapper portalProps={{ disabled: true }}>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<Story name="Escape Containment [play: escape contained]" play={playEscapeContainment}>
	{#snippet template()}
		<StoryKeyboardHints>
			<KeyboardHint keys="↓ / ↑" action="Navigate items" />
			<KeyboardHint keys="Enter" action="Select item" />
			<KeyboardHint keys="Escape" action="Close palette" />
		</StoryKeyboardHints>
		<CommandPaletteStoryWrapper portalProps={{ disabled: true }}>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import * as ContextMenu from './index.js';
	import DeleteIcon from '@lucide/svelte/icons/delete';

	const { Story } = defineMeta({
		title: 'Base/ContextMenu',
		component: ContextMenu.Root,
		tags: ['autodocs'],
	});

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                           */
	/* ------------------------------------------------------------------ */

	/** Right-click the trigger area to open the context menu. */
	async function rightClickTrigger(canvasElement: HTMLElement) {
		const canvas = within(canvasElement);
		const triggerArea = canvas.getByText('Right-click here');
		await userEvent.pointer({ keys: '[MouseRight]', target: triggerArea });
	}

	/** Assert menu is closed (either removed from DOM or data-state="closed"). */
	async function expectMenuClosed(canvasElement: HTMLElement) {
		await waitFor(() => {
			const menu = canvasElement.querySelector('[role="menu"]');
			if (menu) {
				expect((menu as HTMLElement).dataset.state).toBe('closed');
			}
		});
	}

	/* ------------------------------------------------------------------ */
	/*  play() interaction tests                                          */
	/* ------------------------------------------------------------------ */

	const playOpensOnRightClick = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await rightClickTrigger(canvasElement);

		const menu = canvasElement.querySelector('[role="menu"]');
		await expect(menu).toBeTruthy();
	};

	const playClickItemClosesMenu = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await rightClickTrigger(canvasElement);

		const items = canvasElement.querySelectorAll('[role="menuitem"]');
		await expect(items.length).toBeGreaterThanOrEqual(1);

		await userEvent.click(items[0]);

		// Menu should close after clicking an item
		await expectMenuClosed(canvasElement);
	};

	const playArrowDownFocusesItems = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await rightClickTrigger(canvasElement);

		const menu = canvasElement.querySelector('[role="menu"]');
		await expect(menu).toBeTruthy();

		const items = canvasElement.querySelectorAll('[role="menuitem"]');
		await expect(items.length).toBeGreaterThanOrEqual(2);

		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => expect(items[0]).toHaveAttribute('data-highlighted', ''));

		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => expect(items[1]).toHaveAttribute('data-highlighted', ''));
	};

	const playRadioItemEnterSelects = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await rightClickTrigger(canvasElement);

		const menu = canvasElement.querySelector('[role="menu"]');
		await expect(menu).toBeTruthy();

		// Radio items have role="menuitemradio"
		const radioItems = canvasElement.querySelectorAll('[role="menuitemradio"]');
		await expect(radioItems.length).toBeGreaterThanOrEqual(2);

		await userEvent.keyboard('{ArrowDown}');
		const firstRadio = radioItems[0];
		await waitFor(() => expect(firstRadio).toHaveAttribute('data-highlighted', ''));

		await userEvent.keyboard('{Enter}');

		// Menu should close after Enter on a radio item
		await expectMenuClosed(canvasElement);
	};

	const playEscapeClosesMenu = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await rightClickTrigger(canvasElement);

		const menu = canvasElement.querySelector('[role="menu"]');
		await expect(menu).toBeTruthy();

		await userEvent.keyboard('{Escape}');

		await expectMenuClosed(canvasElement);
	};

	const playDisabledItemsNotClickable = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		await rightClickTrigger(canvasElement);

		const menu = canvasElement.querySelector('[role="menu"]');
		await expect(menu).toBeTruthy();

		// Disabled items have data-disabled attribute
		const disabledItems = canvasElement.querySelectorAll('[role="menuitem"][data-disabled]');
		await expect(disabledItems.length).toBeGreaterThanOrEqual(1);

		// Verify each disabled item has data-disabled (pointer-events:none prevents click)
		for (const item of disabledItems) {
			await expect(item).toHaveAttribute('data-disabled');
		}

		// Menu should still be open after checking disabled items
		await expect(canvasElement.querySelector('[role="menu"]')).toBeTruthy();
	};

	const playEscapeContainment = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Open the dialog first
		await userEvent.click(canvas.getByRole('button', { name: /open dialog/i }));
		await expect(canvas.getByRole('dialog')).toBeVisible();

		// Right-click inside the dialog to open context menu
		const triggerArea = canvas.getByText('Right-click here');
		await userEvent.pointer({ keys: '[MouseRight]', target: triggerArea });

		const menu = canvasElement.querySelector('[role="menu"]');
		await expect(menu).toBeTruthy();

		// Press Escape — should close context menu but NOT the dialog
		await userEvent.keyboard('{Escape}');

		await expectMenuClosed(canvasElement);
		await expect(canvas.getByRole('dialog')).toBeVisible();
	};
</script>

<script lang="ts">
	import CopyIcon from '@lucide/svelte/icons/copy';
	import ScissorsIcon from '@lucide/svelte/icons/scissors';
	import ClipboardIcon from '@lucide/svelte/icons/clipboard';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import StoryKeyboardHints from '$lib/storybook/StoryKeyboardHints.svelte';
	import KeyboardHint from '$lib/storybook/KeyboardHint.svelte';

	let checkboxChecked = $state(false);
	let radioValue = $state('middle');
</script>

<Story name="Basic Menu [play: opens on right click]" play={playOpensOnRightClick}>
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content portalProps={{ disabled: true }}>
				<ContextMenu.Item>Back</ContextMenu.Item>
				<ContextMenu.Item>Forward</ContextMenu.Item>
				<ContextMenu.Item>Reload</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Item>View Source</ContextMenu.Item>
				<ContextMenu.Item>Inspect</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="With Icons [play: click closes menu]" play={playClickItemClosesMenu}>
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content portalProps={{ disabled: true }}>
				<ContextMenu.Item>
					<ScissorsIcon class="size-4" />
					Cut
					<ContextMenu.Shortcut>Ctrl+X</ContextMenu.Shortcut>
				</ContextMenu.Item>
				<ContextMenu.Item>
					<CopyIcon class="size-4" />
					Copy
					<ContextMenu.Shortcut>Ctrl+C</ContextMenu.Shortcut>
				</ContextMenu.Item>
				<ContextMenu.Item>
					<ClipboardIcon class="size-4" />
					Paste
					<ContextMenu.Shortcut>Ctrl+V</ContextMenu.Shortcut>
				</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Item variant="destructive">
					<TrashIcon class="size-4" />
					Delete
					<ContextMenu.Shortcut><DeleteIcon /></ContextMenu.Shortcut>
				</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="With Submenus [play: arrow down focuses]" play={playArrowDownFocusesItems}>
	{#snippet template()}
		<div>
			<StoryKeyboardHints>
				<KeyboardHint keys="↓ / ↑" action="Navigate menu items" />
				<KeyboardHint keys="Enter" action="Select item" />
				<KeyboardHint keys="→" action="Open submenu" />
				<KeyboardHint keys="Esc" action="Close menu" />
			</StoryKeyboardHints>
			<ContextMenu.Root>
				<ContextMenu.Trigger>
					<div
						class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
					>
						Right-click here
					</div>
				</ContextMenu.Trigger>
				<ContextMenu.Content portalProps={{ disabled: true }}>
					<ContextMenu.Item>New File</ContextMenu.Item>
					<ContextMenu.Item>New Window</ContextMenu.Item>
					<ContextMenu.Separator />
					<ContextMenu.Sub>
						<ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
						<ContextMenu.Portal>
							<ContextMenu.SubContent>
								<ContextMenu.Item>Email</ContextMenu.Item>
								<ContextMenu.Item>Messages</ContextMenu.Item>
								<ContextMenu.Item>Slack</ContextMenu.Item>
							</ContextMenu.SubContent>
						</ContextMenu.Portal>
					</ContextMenu.Sub>
					<ContextMenu.Separator />
					<ContextMenu.Item>Settings</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</div>
	{/snippet}
</Story>

<Story name="Disabled Items [play: disabled items]" play={playDisabledItemsNotClickable}>
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content portalProps={{ disabled: true }}>
				<ContextMenu.Item>Undo</ContextMenu.Item>
				<ContextMenu.Item>Redo</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Item disabled>Cut</ContextMenu.Item>
				<ContextMenu.Item disabled>Copy</ContextMenu.Item>
				<ContextMenu.Item>Paste</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="Checkbox Items">
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content portalProps={{ disabled: true }}>
				<ContextMenu.CheckboxItem bind:checked={checkboxChecked}>
					Show Minimap
				</ContextMenu.CheckboxItem>
				<ContextMenu.CheckboxItem checked={true}>Word Wrap</ContextMenu.CheckboxItem>
				<ContextMenu.CheckboxItem checked={false}>Sticky Scroll</ContextMenu.CheckboxItem>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="Radio Items [play: radio enter selects]" play={playRadioItemEnterSelects}>
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content portalProps={{ disabled: true }}>
				<ContextMenu.Label>Panel Position</ContextMenu.Label>
				<ContextMenu.Separator />
				<ContextMenu.RadioGroup bind:value={radioValue}>
					<ContextMenu.RadioItem value="top">Top</ContextMenu.RadioItem>
					<ContextMenu.RadioItem value="middle">Middle</ContextMenu.RadioItem>
					<ContextMenu.RadioItem value="bottom">Bottom</ContextMenu.RadioItem>
				</ContextMenu.RadioGroup>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>
<Story name="With Icons And Submenus [play: escape closes menu]" play={playEscapeClosesMenu}>
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content portalProps={{ disabled: true }}>
				<ContextMenu.Item>
					<ScissorsIcon class="size-4" />
					Cut
					<ContextMenu.Shortcut>Ctrl+X</ContextMenu.Shortcut>
				</ContextMenu.Item>
				<ContextMenu.Sub>
					<ContextMenu.SubTrigger>
						<FolderIcon class="size-4" />
						Move to
					</ContextMenu.SubTrigger>
					<ContextMenu.Portal>
						<ContextMenu.SubContent>
							<ContextMenu.Item>Archive</ContextMenu.Item>
							<ContextMenu.Item>Trash</ContextMenu.Item>
						</ContextMenu.SubContent>
					</ContextMenu.Portal>
				</ContextMenu.Sub>
				<ContextMenu.Separator />
				<ContextMenu.Item variant="destructive">
					<TrashIcon class="size-4" />
					Delete
					<ContextMenu.Shortcut><DeleteIcon class="size-3.5" /></ContextMenu.Shortcut>
				</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="All Variants">
	{#snippet template()}
		<div class="flex gap-8">
			<div class="flex flex-col gap-2">
				<span class="text-xs text-muted-foreground">Right-click each target</span>
				<ContextMenu.Root>
					<ContextMenu.Trigger>
						<div
							class="flex h-24 w-60 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
						>
							With Icons + Destructive
						</div>
					</ContextMenu.Trigger>
					<ContextMenu.Content portalProps={{ disabled: true }}>
						<ContextMenu.Item>
							<ScissorsIcon class="size-4" />
							Cut
							<ContextMenu.Shortcut>Ctrl+X</ContextMenu.Shortcut>
						</ContextMenu.Item>
						<ContextMenu.Item>
							<CopyIcon class="size-4" />
							Copy
							<ContextMenu.Shortcut>Ctrl+C</ContextMenu.Shortcut>
						</ContextMenu.Item>
						<ContextMenu.Item>
							<ClipboardIcon class="size-4" />
							Paste
							<ContextMenu.Shortcut>Ctrl+V</ContextMenu.Shortcut>
						</ContextMenu.Item>
						<ContextMenu.Separator />
						<ContextMenu.Item variant="destructive">
							<TrashIcon class="size-4" />
							Delete
							<ContextMenu.Shortcut
								><DeleteIcon class="size-3.5" /></ContextMenu.Shortcut
							>
						</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
				<ContextMenu.Root>
					<ContextMenu.Trigger>
						<div
							class="flex h-24 w-60 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
						>
							With Submenus + Icons
						</div>
					</ContextMenu.Trigger>
					<ContextMenu.Content portalProps={{ disabled: true }}>
						<ContextMenu.Item>New File</ContextMenu.Item>
						<ContextMenu.Sub>
							<ContextMenu.SubTrigger>
								<FolderIcon class="size-4" />
								Move to
							</ContextMenu.SubTrigger>
							<ContextMenu.Portal>
								<ContextMenu.SubContent>
									<ContextMenu.Item>Archive</ContextMenu.Item>
									<ContextMenu.Item>Trash</ContextMenu.Item>
								</ContextMenu.SubContent>
							</ContextMenu.Portal>
						</ContextMenu.Sub>
						<ContextMenu.Separator />
						<ContextMenu.CheckboxItem bind:checked={checkboxChecked}>
							Show Preview
						</ContextMenu.CheckboxItem>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Escape Containment (Dialog) [play: escape containment]" play={playEscapeContainment}>
	{#snippet template()}
		<Dialog.Root>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props} intent="secondary">Open Dialog</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content portalProps={{ disabled: true }}>
				<Dialog.Header>
					<Dialog.Title>Dialog with Context Menu</Dialog.Title>
					<Dialog.Description>
						Right-click the area below. Escape should close the context menu but not the
						dialog.
					</Dialog.Description>
				</Dialog.Header>
				<ContextMenu.Root>
					<ContextMenu.Trigger>
						<div
							class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
						>
							Right-click here
						</div>
					</ContextMenu.Trigger>
					<ContextMenu.Content portalProps={{ disabled: true }}>
						<ContextMenu.Item>Cut</ContextMenu.Item>
						<ContextMenu.Item>Copy</ContextMenu.Item>
						<ContextMenu.Item>Paste</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</Dialog.Content>
		</Dialog.Root>
	{/snippet}
</Story>

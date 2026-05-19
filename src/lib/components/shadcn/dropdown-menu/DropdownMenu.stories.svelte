<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor } from 'storybook/test';
	import * as DropdownMenu from './index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import UserIcon from '@lucide/svelte/icons/user';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import ScissorsIcon from '@lucide/svelte/icons/scissors';
	import ClipboardIcon from '@lucide/svelte/icons/clipboard';
	import DeleteIcon from '@lucide/svelte/icons/delete';
	import StoryKeyboardHints from '$lib/storybook/StoryKeyboardHints.svelte';
	import KeyboardHint from '$lib/storybook/KeyboardHint.svelte';

	const { Story } = defineMeta({
		title: 'Base/DropdownMenu',
		component: DropdownMenu.Root,
		tags: ['autodocs'],
	});

	/** Assert menu is closed (either removed from DOM or data-state="closed"). */
	async function expectMenuClosed(canvasElement: HTMLElement) {
		await waitFor(() => {
			const menu = canvasElement.querySelector('[role="menu"]');
			if (menu) {
				expect((menu as HTMLElement).dataset.state).toBe('closed');
			}
		});
	}

	/** Find the DropdownMenu trigger button (skips ThemeDecorator buttons). */
	function findDropdownTrigger(canvasElement: HTMLElement): HTMLElement {
		const trigger = canvasElement.querySelector(
			'[data-dropdown-menu-trigger] [data-slot="button"]',
		) as HTMLElement | null;
		if (trigger) {
			return trigger;
		}
		// Fallback: find button inside dropdown-menu-trigger data-slot
		const slotTrigger = canvasElement.querySelector(
			'[data-slot="dropdown-menu-trigger"]',
		) as HTMLElement | null;
		if (slotTrigger) {
			return slotTrigger;
		}
		throw new Error('DropdownMenu trigger button not found');
	}

	const playOpensOnClick = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const trigger = findDropdownTrigger(canvasElement);

		trigger.click();
		await waitFor(() => expect(canvasElement.querySelector('[role="menu"]')).toBeTruthy());
	};

	const playArrowDownFocusesItems = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const trigger = findDropdownTrigger(canvasElement);

		// Use native click to bypass pointer-events:none on child-snippet triggers
		trigger.click();
		await waitFor(() => expect(canvasElement.querySelector('[role="menu"]')).toBeTruthy());

		const items = canvasElement.querySelectorAll('[role="menuitem"]');
		await expect(items.length).toBeGreaterThanOrEqual(2);

		// bits-ui highlights items via data-highlighted while keeping focus on the menu container
		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => expect(items[0]).toHaveAttribute('data-highlighted', ''));

		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => expect(items[1]).toHaveAttribute('data-highlighted', ''));
	};

	const playEnterSelectsItem = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const trigger = findDropdownTrigger(canvasElement);

		trigger.click();
		await waitFor(() => expect(canvasElement.querySelector('[role="menu"]')).toBeTruthy());

		await userEvent.keyboard('{ArrowDown}');

		// bits-ui may keep focus on the menu content while highlighting items via data-highlighted
		const firstItem = canvasElement.querySelectorAll('[role="menuitem"]')[0];
		await waitFor(() => expect(firstItem).toHaveAttribute('data-highlighted', ''));

		await userEvent.keyboard('{Enter}');

		// Menu should close after selecting an item
		await expectMenuClosed(canvasElement);
	};

	const playEscapeClosesMenu = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const trigger = findDropdownTrigger(canvasElement);

		// Use native click to bypass pointer-events:none on child-snippet triggers
		trigger.click();
		await waitFor(() => expect(canvasElement.querySelector('[role="menu"]')).toBeTruthy());

		await userEvent.keyboard('{Escape}');

		await expectMenuClosed(canvasElement);
	};
</script>

<Story name="Basic [play: opens on click]" play={playOpensOnClick}>
	{#snippet template()}
		<div class="flex items-start justify-center h-48 pt-4">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button intent="secondary">Open Menu</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content portalProps={{ disabled: true }}>
					<DropdownMenu.Item>Profile</DropdownMenu.Item>
					<DropdownMenu.Item>Settings</DropdownMenu.Item>
					<DropdownMenu.Item>Billing</DropdownMenu.Item>
					<DropdownMenu.Item>Sign out</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	{/snippet}
</Story>

<Story name="With Separators [play: arrow down focuses]" play={playArrowDownFocusesItems}>
	{#snippet template()}
		<div class="flex items-start justify-center h-48 pt-4">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>Open Menu</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content portalProps={{ disabled: true }}>
					<DropdownMenu.Group>
						<DropdownMenu.Label>My Account</DropdownMenu.Label>
						<DropdownMenu.Item>Profile</DropdownMenu.Item>
						<DropdownMenu.Item>Settings</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.Label>Workspace</DropdownMenu.Label>
						<DropdownMenu.Item>Invite members</DropdownMenu.Item>
						<DropdownMenu.Item>Manage team</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Item>Sign out</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	{/snippet}
</Story>

<Story name="With Icons [play: enter selects item]" play={playEnterSelectsItem}>
	{#snippet template()}
		<div class="flex items-start justify-center h-48 pt-4">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button intent="secondary">Open Menu</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content portalProps={{ disabled: true }}>
					<DropdownMenu.Item>
						<UserIcon />
						Profile
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<SettingsIcon />
						Settings
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item variant="destructive">
						<LogOutIcon />
						Sign out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	{/snippet}
</Story>

<Story name="With Keyboard Shortcuts [play: escape closes menu]" play={playEscapeClosesMenu}>
	{#snippet template()}
		<div class="flex flex-col items-center h-64 pt-4 gap-4">
			<StoryKeyboardHints>
				<KeyboardHint keys="↓ / ↑" action="Navigate menu items" />
				<KeyboardHint keys="Enter" action="Select item" />
				<KeyboardHint keys="Esc" action="Close menu" />
			</StoryKeyboardHints>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>Edit</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content portalProps={{ disabled: true }}>
					<DropdownMenu.Item>
						<CopyIcon />
						Copy
						<DropdownMenu.Shortcut>Ctrl+C</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<ScissorsIcon />
						Cut
						<DropdownMenu.Shortcut>Ctrl+X</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<ClipboardIcon />
						Paste
						<DropdownMenu.Shortcut>Ctrl+V</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item variant="destructive">
						<TrashIcon />
						Delete
						<DropdownMenu.Shortcut><DeleteIcon /></DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	{/snippet}
</Story>

<Story name="With Sub-Menu">
	{#snippet template()}
		<div class="flex items-start justify-center h-48 pt-4">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button intent="secondary">Open Menu</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content portalProps={{ disabled: true }}>
					<DropdownMenu.Item>Profile</DropdownMenu.Item>
					<DropdownMenu.Item>Settings</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>More options</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.Item>Export data</DropdownMenu.Item>
							<DropdownMenu.Item>Import data</DropdownMenu.Item>
							<DropdownMenu.Item>Archive workspace</DropdownMenu.Item>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
					<DropdownMenu.Separator />
					<DropdownMenu.Item>Sign out</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	{/snippet}
</Story>

<Story name="With Disabled Items">
	{#snippet template()}
		<div class="flex items-start justify-center h-48 pt-4">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button intent="secondary">Open Menu</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="min-w-55" portalProps={{ disabled: true }}>
					<DropdownMenu.Item>
						<UserIcon />
						Profile
					</DropdownMenu.Item>
					<DropdownMenu.Item disabled>
						<SettingsIcon />
						Settings
						<DropdownMenu.Shortcut>Ctrl+,</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item disabled>
						<CopyIcon />
						Duplicate workspace
					</DropdownMenu.Item>
					<DropdownMenu.Item variant="destructive">
						<LogOutIcon />
						Sign out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	{/snippet}
</Story>

<Story name="All Variants">
	{#snippet template()}
		<div class="flex gap-6 flex-wrap items-start pt-4 px-4 h-64">
			<!-- Dropdown 1: Icons + headers + separators -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button intent="secondary">Account</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="min-w-52" portalProps={{ disabled: true }}>
					<DropdownMenu.Group>
						<DropdownMenu.Label>My Account</DropdownMenu.Label>
						<DropdownMenu.Item>
							<UserIcon />
							Profile
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<SettingsIcon />
							Settings
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Item variant="destructive">
						<LogOutIcon />
						Sign out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Dropdown 2: With disabled items -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button intent="secondary">Workspace</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="min-w-55" portalProps={{ disabled: true }}>
					<DropdownMenu.Item>
						<UserIcon />
						Profile
					</DropdownMenu.Item>
					<DropdownMenu.Item disabled>
						<SettingsIcon />
						Settings
						<DropdownMenu.Shortcut>Ctrl+,</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item disabled>
						<CopyIcon />
						Duplicate workspace
					</DropdownMenu.Item>
					<DropdownMenu.Item variant="destructive">
						<LogOutIcon />
						Sign out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Dropdown 3: Destructive item with keyboard shortcut -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button intent="secondary">Edit</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="min-w-48" portalProps={{ disabled: true }}>
					<DropdownMenu.Item>
						<CopyIcon />
						Copy
						<DropdownMenu.Shortcut>Ctrl+C</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<ScissorsIcon />
						Cut
						<DropdownMenu.Shortcut>Ctrl+X</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<ClipboardIcon />
						Paste
						<DropdownMenu.Shortcut>Ctrl+V</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item variant="destructive">
						<TrashIcon />
						Delete
						<DropdownMenu.Shortcut><DeleteIcon /></DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	{/snippet}
</Story>

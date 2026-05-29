<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import * as Popover from './index.js';
	import { Checkbox } from '$lib/components/shadcn/checkbox/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Kbd, KbdGroup } from '$lib/components/shadcn/kbd/index.js';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import UserIcon from '@lucide/svelte/icons/user';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import CommandIcon from '@lucide/svelte/icons/command';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import GithubIcon from '@lucide/svelte/icons/git-branch';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import BellIcon from '@lucide/svelte/icons/bell';
	import StoryKeyboardHints from '$lib/storybook/StoryKeyboardHints.svelte';
	import KeyboardHint from '$lib/storybook/KeyboardHint.svelte';

	const { Story } = defineMeta({
		title: 'Base/Popover',
		component: Popover.Root,
		tags: ['autodocs'],
	});

	/* ------------------------------------------------------------------ */
	/*  Shared helpers                                                      */
	/* ------------------------------------------------------------------ */

	/** Helper: find popover content inside the canvas (portal disabled in stories). */
	function getPopoverContent(canvas: HTMLElement): HTMLElement | null {
		return canvas.querySelector('[data-slot="popover-content"]');
	}

	/** Helper: assert popover content is closed (either absent or data-state="closed"). */
	async function expectPopoverClosed(canvas: HTMLElement) {
		const content = getPopoverContent(canvas);
		if (content) {
			await waitFor(() => expect(content.dataset.state).toBe('closed'));
			return;
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Filter / Sort / Legend play functions                               */
	/* ------------------------------------------------------------------ */

	/** Click trigger -> popover opens, Escape -> popover closes. */
	const playOpenAndEscapeClose = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('button', { name: /filter/i });

		// Popover starts closed
		await expectPopoverClosed(canvasElement);

		// Click trigger -> opens
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement);
		await expect(content).not.toBeNull();
		await expect(content).toHaveAttribute('data-state', 'open');

		// Escape -> closes
		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);
	};

	/** Popover starts open, click outside -> popover closes. */
	const playClickOutsideCloses = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// "Open by Default" story starts with the popover already open
		await expect(getPopoverContent(canvasElement)).not.toBeNull();

		// Click outside the popover (on the canvas wrapper)
		await userEvent.click(canvasElement);
		await expectPopoverClosed(canvasElement);
	};

	/** Click a sort item -> data-state="active" updates, click another -> previous deactivates. */
	const playSortItemSelection = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('button', { name: /sort by/i });

		// Open popover
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement)!;

		// "Updated · newest" is active by default
		const items = [...content.querySelectorAll('[role="menuitem"]')] as HTMLElement[];
		await expect(items[0]).toHaveAttribute('data-state', 'active'); // Updated · newest

		// Click "Created · newest"
		await userEvent.click(items[1]);
		await expect(items[1]).toHaveAttribute('data-state', 'active');
		await expect(items[0]).not.toHaveAttribute('data-state', 'active');
	};

	/** Escape closes popover and trigger remains accessible (containment test). */
	const playEscapeContainment = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('button', { name: /legend/i });

		// Open popover
		await userEvent.click(trigger);
		await expect(getPopoverContent(canvasElement)).not.toBeNull();

		// Press Escape — should close popover
		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);

		// Trigger should remain in the DOM (parent layer not dismissed)
		await expect(trigger).toBeVisible();
	};

	/* ------------------------------------------------------------------ */
	/*  Account Dropdown play functions                                    */
	/* ------------------------------------------------------------------ */

	/** Click account trigger -> dropdown opens, Escape -> dropdown closes. */
	const playAccountOpenAndEscapeClose = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('button', { name: /lukas/i });

		// Dropdown starts closed
		await expectPopoverClosed(canvasElement);

		// Click trigger -> opens
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement);
		await expect(content).not.toBeNull();
		await expect(content).toHaveAttribute('data-state', 'open');

		// Escape -> closes
		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);
	};

	/** Click a menu item -> item is accessible and clickable. */
	const playAccountClickMenuItem = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('button', { name: /lukas/i });

		// Open dropdown
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement)!;

		// Find menu items (Popover.Item renders role="menuitem")
		const items = [...content.querySelectorAll('[role="menuitem"]')] as HTMLElement[];
		await expect(items.length).toBeGreaterThanOrEqual(6);

		// First item should be "Profile"
		await expect(items[0]).toHaveTextContent(/profile/i);

		// Click "Settings" item
		await userEvent.click(items[1]);
	};

	/** Click outside the account dropdown -> dropdown closes. */
	const playAccountClickOutsideCloses = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('button', { name: /lukas/i });

		// Open
		await userEvent.click(trigger);
		await expect(getPopoverContent(canvasElement)).not.toBeNull();

		// Click outside
		await userEvent.click(canvasElement);
		await expectPopoverClosed(canvasElement);
	};

	/** Escape closes account dropdown and trigger remains accessible (containment test). */
	const playAccountEscapeContainment = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('button', { name: /lukas/i });

		// Open dropdown
		await userEvent.click(trigger);
		await expect(getPopoverContent(canvasElement)).not.toBeNull();

		// Press Escape — should close dropdown
		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);

		// Trigger should remain in DOM (parent layer not dismissed)
		await expect(trigger).toBeVisible();
	};

	/* ------------------------------------------------------------------ */
	/*  Notifications Popover play functions                               */
	/* ------------------------------------------------------------------ */

	/** Find the bell-icon popover trigger button (not the ThemeDecorator buttons). */
	function findBellTrigger(canvasElement: HTMLElement): HTMLElement {
		// Button has both data-popover-trigger and data-slot="button" on the same element
		const trigger = canvasElement.querySelector(
			'[data-popover-trigger][data-slot="button"]',
		) as HTMLElement | null;
		if (trigger) {
			return trigger;
		}
		// Fallback: find the raw popover trigger button
		const rawTrigger = canvasElement.querySelector(
			'[data-popover-trigger]',
		) as HTMLElement | null;
		if (rawTrigger) {
			return rawTrigger;
		}
		throw new Error('Bell trigger button not found');
	}

	/** Click bell trigger -> popover opens, Escape -> popover closes. */
	const playNotificationsOpenAndEscapeClose = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const trigger = findBellTrigger(canvasElement);

		// Popover starts closed
		await expectPopoverClosed(canvasElement);

		// Click trigger -> opens
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement);
		await expect(content).not.toBeNull();
		await expect(content).toHaveAttribute('data-state', 'open');

		// Escape -> closes
		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);
	};

	/** Click "Mark all read" → unread count drops to zero, button disables, highlights removed. */
	const playMarkAllRead = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const trigger = findBellTrigger(canvasElement);

		// Open popover
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement)!;
		const contentScope = within(content);

		// Before: 3 unread, button enabled, highlight rows present
		await expect(contentScope.getByText(/3 unread/)).toBeVisible();
		const markAllReadButton = contentScope.getByRole('button', { name: /mark all read/i });
		await expect(markAllReadButton).toBeEnabled();
		expect(content.querySelectorAll('[data-unread]').length).toBe(3);

		// Click "Mark all read"
		await userEvent.click(markAllReadButton);

		// After: no unread label, button disabled, no highlight rows
		await waitFor(() => {
			expect(contentScope.queryByText(/unread/)).toBeNull();
		});
		await waitFor(() => {
			expect(markAllReadButton).toBeDisabled();
		});
		await waitFor(() => {
			expect(content.querySelectorAll('[data-unread]').length).toBe(0);
		});
	};

	/** Click outside the notifications popover -> popover closes. */
	const playNotificationsClickOutsideCloses = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const trigger = findBellTrigger(canvasElement);

		// Open
		await userEvent.click(trigger);
		await expect(getPopoverContent(canvasElement)).not.toBeNull();

		// Click outside
		await userEvent.click(canvasElement);
		await expectPopoverClosed(canvasElement);
	};

	/** Escape from notifications popover does NOT propagate to parent (containment test). */
	const playNotificationsEscapeContainment = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const trigger = findBellTrigger(canvasElement);

		// Open popover
		await userEvent.click(trigger);
		await expect(getPopoverContent(canvasElement)).not.toBeNull();

		// Press Escape — should close popover
		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);

		// Trigger should remain in DOM (parent layer not dismissed)
		await expect(trigger).toBeVisible();
	};

	const NOTIFICATIONS = [
		{
			tone: 'warning' as const,
			dotColor: 'bg-status-warning',
			title: '#103 changes requested',
			body: '@reviewer left 2 comments on PR #29',
			time: '4m',
			unread: true,
		},
		{
			tone: 'success' as const,
			dotColor: 'bg-status-success',
			title: '#091 PR approved',
			body: 'Provider trait expansion is ready to merge',
			time: '1h',
			unread: true,
		},
		{
			tone: 'info' as const,
			dotColor: 'bg-status-info',
			title: '#118 PR draft pushed',
			body: '2 new commits on feat/forest-overlays',
			time: '3h',
			unread: true,
		},
		{
			tone: 'muted' as const,
			dotColor: 'bg-foreground-subtle',
			title: '#066 branch deleted',
			body: 'Upstream removed feat/deprecated-polling',
			time: 'yest',
			unread: false,
		},
	] as const;
</script>

<script lang="ts">
	// Reactive state for Sort story — selecting sort/group values updates checkmarks
	let sortBy = $state('updated');
	let groupBy = $state('repository');

	// Reactive state for Notifications story
	let notifications = $state(NOTIFICATIONS.map((n) => ({ ...n, unread: n.unread as boolean })));
	let unreadCount = $derived(notifications.filter((n) => n.unread).length);

	function markAllRead() {
		for (const notification of notifications) {
			notification.unread = false;
		}
	}
</script>

<!-- ================================================================== -->
<!--  Filter / Sort / Legend stories                                     -->
<!-- ================================================================== -->

<Story name="Filter [play: open and escape close]" play={playOpenAndEscapeClose}>
	{#snippet template()}
		<StoryKeyboardHints>
			<KeyboardHint keys="Escape" action="Close popover" />
		</StoryKeyboardHints>
		<div class="flex items-start gap-4 p-4">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>
							<FilterIcon data-icon="inline-start" />
							Filter
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-60" portalProps={{ disabled: true }}>
					<Popover.Label>Status</Popover.Label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox checked />
						Running
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox checked />
						PR draft
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox />
						Approved
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox />
						Merged
					</label>
					<Popover.Divider />
					<Popover.Label>Provider</Popover.Label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox checked />
						Claude
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox />
						Codex
					</label>
					<Popover.Divider />
					<!-- Keyboard hints: Enter = Apply, Ctrl+R = Reset. Tab/Space on checkboxes handled by bits-ui. -->
					<div class="flex gap-1.5 px-1 pb-1 pt-0.5">
						<Button intent="ghost" size="sm" class="flex-1">
							<KbdGroup><Kbd>Ctrl</Kbd><Kbd>R</Kbd></KbdGroup>
							Reset
						</Button>
						<Button intent="primary" size="sm" class="flex-1">
							Apply
							<Kbd format="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
						</Button>
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	{/snippet}
</Story>

<Story name="Sort [play: sort item selection]" play={playSortItemSelection}>
	{#snippet template()}
		<div class="flex items-start gap-4 p-4">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>
							<LayersIcon data-icon="inline-start" />
							Sort by
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-55" portalProps={{ disabled: true }}>
					<Popover.Label>Sort by</Popover.Label>
					<Popover.Item
						active={sortBy === 'updated'}
						onclick={() => (sortBy = 'updated')}
					>
						{#if sortBy === 'updated'}<CheckIcon class="size-2.75" />{:else}<span
								class="size-2.75"
							></span>{/if}
						Updated · newest
					</Popover.Item>
					<Popover.Item
						active={sortBy === 'created'}
						onclick={() => (sortBy = 'created')}
					>
						{#if sortBy === 'created'}<CheckIcon class="size-2.75" />{:else}<span
								class="size-2.75"
							></span>{/if}
						Created · newest
					</Popover.Item>
					<Popover.Item active={sortBy === 'number'} onclick={() => (sortBy = 'number')}>
						{#if sortBy === 'number'}<CheckIcon class="size-2.75" />{:else}<span
								class="size-2.75"
							></span>{/if}
						Issue # · ascending
					</Popover.Item>
					<Popover.Item active={sortBy === 'stage'} onclick={() => (sortBy = 'stage')}>
						{#if sortBy === 'stage'}<CheckIcon class="size-2.75" />{:else}<span
								class="size-2.75"
							></span>{/if}
						Tree stage
					</Popover.Item>
					<Popover.Item
						active={sortBy === 'provider'}
						onclick={() => (sortBy = 'provider')}
					>
						{#if sortBy === 'provider'}<CheckIcon class="size-2.75" />{:else}<span
								class="size-2.75"
							></span>{/if}
						Provider
					</Popover.Item>
					<Popover.Divider />
					<Popover.Label>Group by</Popover.Label>
					<Popover.Item active={groupBy === 'none'} onclick={() => (groupBy = 'none')}>
						{#if groupBy === 'none'}<CheckIcon class="size-2.75" />{:else}<span
								class="size-2.75"
							></span>{/if}
						None
					</Popover.Item>
					<Popover.Item
						active={groupBy === 'repository'}
						onclick={() => (groupBy = 'repository')}
					>
						{#if groupBy === 'repository'}<CheckIcon class="size-2.75" />{:else}<span
								class="size-2.75"
							></span>{/if}
						Repository
					</Popover.Item>
					<Popover.Item
						active={groupBy === 'status'}
						onclick={() => (groupBy = 'status')}
					>
						{#if groupBy === 'status'}<CheckIcon class="size-2.75" />{:else}<span
								class="size-2.75"
							></span>{/if}
						Status
					</Popover.Item>
				</Popover.Content>
			</Popover.Root>
		</div>
	{/snippet}
</Story>

<Story name="Legend [play: escape containment]" play={playEscapeContainment}>
	{#snippet template()}
		<StoryKeyboardHints>
			<KeyboardHint keys="Escape" action="Close popover" />
		</StoryKeyboardHints>
		<div class="flex items-start gap-4 p-4">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>
							<SparklesIcon data-icon="inline-start" />
							Legend
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-60" portalProps={{ disabled: true }}>
					<Popover.Label>Tree state legend</Popover.Label>
					<div class="grid gap-1.5 px-2 pb-1.5">
						{#each [{ color: 'bg-[oklch(0.69_0.098_132)]', label: 'Growing — session active' }, { color: 'bg-[oklch(0.77_0.15_65)]', label: 'Fruiting — PR open' }, { color: 'bg-[#e8a8c0]', label: 'Flowering — approved' }, { color: 'bg-[#e8a64a]', label: 'Seasonal — review' }, { color: 'bg-foreground-subtle', label: 'Bare — merged' }, { color: 'bg-[#6c5d4e]', label: 'Dead — branch gone' }] as entry (entry.label)}
							<div class="flex items-center gap-2">
								<span class="size-2 shrink-0 rounded-0.5 {entry.color}"></span>
								<span class="text-(length:--text-2xs) text-foreground"
									>{entry.label}</span
								>
							</div>
						{/each}
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	{/snippet}
</Story>

<Story name="Open by Default [play: click outside closes]" play={playClickOutsideCloses}>
	{#snippet template()}
		<div class="flex items-start gap-4 p-4 pb-72">
			<Popover.Root open={true}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>
							<FilterIcon data-icon="inline-start" />
							Filter
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-60" portalProps={{ disabled: true }}>
					<Popover.Label>Status</Popover.Label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox checked />
						Running
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox checked />
						PR draft
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox />
						Approved
					</label>
					<Popover.Divider />
					<div class="flex gap-1.5 px-1 pb-1 pt-0.5">
						<Button intent="ghost" size="sm" class="flex-1">
							<KbdGroup><Kbd>Ctrl</Kbd><Kbd>R</Kbd></KbdGroup>
							Reset
						</Button>
						<Button intent="primary" size="sm" class="flex-1">
							Apply
							<Kbd format="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
						</Button>
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	{/snippet}
</Story>

<Story name="All Open">
	{#snippet template()}
		<div class="flex items-start gap-8 p-8" style="min-height: 420px;">
			<!-- Filter popover open -->
			<Popover.Root open={true}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>
							<FilterIcon data-icon="inline-start" />
							Filter
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-60" portalProps={{ disabled: true }}>
					<Popover.Label>Status</Popover.Label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox checked />
						Running
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox checked />
						PR draft
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox />
						Approved
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox />
						Merged
					</label>
					<Popover.Divider />
					<Popover.Label>Provider</Popover.Label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox checked />
						Claude
					</label>
					<label
						class="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-(length:--text-sm) hover:bg-surface-2"
					>
						<Checkbox />
						Codex
					</label>
					<Popover.Divider />
					<div class="flex gap-1.5 px-1 pb-1 pt-0.5">
						<Button intent="ghost" size="sm" class="flex-1">
							<KbdGroup><Kbd>Ctrl</Kbd><Kbd>R</Kbd></KbdGroup>
							Reset
						</Button>
						<Button intent="primary" size="sm" class="flex-1">
							Apply
							<Kbd format="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
						</Button>
					</div>
				</Popover.Content>
			</Popover.Root>

			<!-- Sort popover open -->
			<Popover.Root open={true}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>
							<LayersIcon data-icon="inline-start" />
							Sort by
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-55" portalProps={{ disabled: true }}>
					<Popover.Label>Sort by</Popover.Label>
					<Popover.Item active>
						<CheckIcon class="size-2.75" />
						Updated · newest
					</Popover.Item>
					<Popover.Item>
						<span class="size-2.75"></span>
						Created · newest
					</Popover.Item>
					<Popover.Item>
						<span class="size-2.75"></span>
						Issue # · ascending
					</Popover.Item>
					<Popover.Item>
						<span class="size-2.75"></span>
						Tree stage
					</Popover.Item>
					<Popover.Item>
						<span class="size-2.75"></span>
						Provider
					</Popover.Item>
					<Popover.Divider />
					<Popover.Label>Group by</Popover.Label>
					<Popover.Item>
						<span class="size-2.75"></span>
						None
					</Popover.Item>
					<Popover.Item active>
						<CheckIcon class="size-2.75" />
						Repository
					</Popover.Item>
					<Popover.Item>
						<span class="size-2.75"></span>
						Status
					</Popover.Item>
				</Popover.Content>
			</Popover.Root>

			<!-- Legend popover open -->
			<Popover.Root open={true}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>
							<SparklesIcon data-icon="inline-start" />
							Legend
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-60" portalProps={{ disabled: true }}>
					<Popover.Label>Tree state legend</Popover.Label>
					<div class="grid gap-1.5 px-2 pb-1.5">
						{#each [{ color: 'bg-[oklch(0.69_0.098_132)]', label: 'Growing — session active' }, { color: 'bg-[oklch(0.77_0.15_65)]', label: 'Fruiting — PR open' }, { color: 'bg-[#e8a8c0]', label: 'Flowering — approved' }, { color: 'bg-[#e8a64a]', label: 'Seasonal — review' }, { color: 'bg-foreground-subtle', label: 'Bare — merged' }, { color: 'bg-[#6c5d4e]', label: 'Dead — branch gone' }] as entry (entry.label)}
							<div class="flex items-center gap-2">
								<span class="size-2 shrink-0 rounded-0.5 {entry.color}"></span>
								<span class="text-(length:--text-2xs) text-foreground"
									>{entry.label}</span
								>
							</div>
						{/each}
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	{/snippet}
</Story>

<!-- ================================================================== -->
<!--  Account Dropdown stories                                           -->
<!-- ================================================================== -->

{#snippet accountDropdownTemplate()}
	<StoryKeyboardHints>
		<KeyboardHint keys="Escape" action="Close dropdown" />
	</StoryKeyboardHints>
	<div class="p-4">
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button intent="secondary" class="w-70 justify-between" {...props}>
						<span class="flex items-center gap-2">
							<span
								class="flex size-5.5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
							>
								L
							</span>
							Lukas
						</span>
						<ChevronDownIcon data-icon="inline-end" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-70 p-0" portalProps={{ disabled: true }}>
				<div class="flex items-center gap-2.5 border-b border-border px-3 py-3">
					<span
						class="flex size-8 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground"
					>
						L
					</span>
					<div class="min-w-0">
						<div class="text-(length:--text-md) font-medium">Lukas Hron</div>
						<div class="truncate text-(length:--text-2xs) text-foreground-subtle">
							lukas@grovekeeper.dev
						</div>
					</div>
				</div>
				<div class="p-1.5">
					<Popover.Item>
						<UserIcon class="size-3.5" />
						Profile
						<KbdGroup class="ml-auto">
							<Kbd format="lucide"><CommandIcon /></Kbd>
							<Kbd>P</Kbd>
						</KbdGroup>
					</Popover.Item>
					<Popover.Item>
						<SettingsIcon class="size-3.5" />
						Settings
						<KbdGroup class="ml-auto">
							<Kbd format="lucide"><CommandIcon /></Kbd>
							<Kbd>,</Kbd>
						</KbdGroup>
					</Popover.Item>
					<Popover.Item>
						<DatabaseIcon class="size-3.5" />
						Billing &amp; usage
					</Popover.Item>
					<Popover.Divider />
					<Popover.Label>Theme</Popover.Label>
					<div class="flex gap-1 px-2 pb-1.5">
						<Button intent="secondary" size="sm" class="flex-1">
							<SunIcon data-icon="inline-start" />
							Light
						</Button>
						<Button intent="primary" size="sm" class="flex-1">
							<MoonIcon data-icon="inline-start" />
							Dark
						</Button>
						<Button intent="secondary" size="sm" class="flex-1">Auto</Button>
					</div>
					<Popover.Divider />
					<Popover.Item>
						<GlobeIcon class="size-3.5" />
						Workspaces
						<ChevronRightIcon class="ml-auto size-3" />
					</Popover.Item>
					<Popover.Item>
						<GithubIcon class="size-3.5" />
						GitHub integrations
					</Popover.Item>
					<Popover.Divider />
					<Popover.Item class="text-status-danger">
						<LogOutIcon class="size-3.5" />
						Sign out
					</Popover.Item>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
{/snippet}

<Story name="Account Dropdown [play: open and escape close]" play={playAccountOpenAndEscapeClose}>
	{#snippet template()}
		{@render accountDropdownTemplate()}
	{/snippet}
</Story>

<Story
	name="Account Dropdown — Click Menu Item [play: click menu item]"
	play={playAccountClickMenuItem}
>
	{#snippet template()}
		{@render accountDropdownTemplate()}
	{/snippet}
</Story>

<Story
	name="Account Dropdown — Click Outside Closes [play: click outside closes]"
	play={playAccountClickOutsideCloses}
>
	{#snippet template()}
		{@render accountDropdownTemplate()}
	{/snippet}
</Story>

<Story
	name="Account Dropdown — Escape Containment [play: escape containment]"
	play={playAccountEscapeContainment}
>
	{#snippet template()}
		{@render accountDropdownTemplate()}
	{/snippet}
</Story>

<!-- ================================================================== -->
<!--  Notifications Popover stories                                      -->
<!-- ================================================================== -->

{#snippet notificationsTemplate()}
	<StoryKeyboardHints>
		<KeyboardHint keys="Escape" action="Close popover" />
	</StoryKeyboardHints>
	<div class="p-4">
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<div class="relative inline-block">
						<Button intent="secondary" size="icon" aria-label="Demo" {...props}>
							<BellIcon data-icon="inline-start" />
						</Button>
						{#if unreadCount > 0}
							<span
								class="absolute right-1 top-1 size-1.75 rounded-full bg-status-danger"
							></span>
						{/if}
					</div>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-75 p-0" align="end" portalProps={{ disabled: true }}>
				<div class="flex items-center justify-between border-b border-border px-3 py-2.5">
					<div class="text-(length:--text-md) font-semibold">
						Inbox{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
					</div>
					<Button
						intent="ghost"
						size="sm"
						onclick={markAllRead}
						disabled={unreadCount === 0}>Mark all read</Button
					>
				</div>
				<div class="max-h-80 overflow-y-auto">
					{#each notifications as notification (notification.title)}
						<div
							class="flex gap-2.5 border-b border-border px-3 py-2.5 last:border-b-0"
							data-unread={notification.unread ? '' : undefined}
							style={notification.unread
								? 'background: color-mix(in oklch, var(--primary) 4%, transparent)'
								: ''}
						>
							<span
								class="mt-1.5 size-1.5 shrink-0 rounded-full {notification.dotColor}"
							></span>
							<div class="min-w-0 flex-1">
								<div
									class="text-[12.5px] {notification.unread
										? 'font-semibold'
										: 'font-medium'}"
								>
									{notification.title}
								</div>
								<div class="mt-px text-(length:--text-2xs) text-foreground-muted">
									{notification.body}
								</div>
							</div>
							<div
								class="shrink-0 font-mono text-(length:--text-2xs) text-foreground-subtle"
							>
								{notification.time}
							</div>
						</div>
					{/each}
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
{/snippet}

<Story
	name="Notifications Popover [play: open and escape close]"
	play={playNotificationsOpenAndEscapeClose}
>
	{#snippet template()}
		{@render notificationsTemplate()}
	{/snippet}
</Story>

<Story name="Notifications Popover — Mark All Read [play: mark all read]" play={playMarkAllRead}>
	{#snippet template()}
		{@render notificationsTemplate()}
	{/snippet}
</Story>

<Story
	name="Notifications Popover — Click Outside Closes [play: click outside closes]"
	play={playNotificationsClickOutsideCloses}
>
	{#snippet template()}
		{@render notificationsTemplate()}
	{/snippet}
</Story>

<Story
	name="Notifications Popover — Escape Containment [play: escape containment]"
	play={playNotificationsEscapeContainment}
>
	{#snippet template()}
		{@render notificationsTemplate()}
	{/snippet}
</Story>

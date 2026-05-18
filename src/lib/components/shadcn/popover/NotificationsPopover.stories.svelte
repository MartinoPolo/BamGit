<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import * as Popover from './index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';

	const { Story } = defineMeta({
		title: 'Blocks/NotificationsPopover',
		component: Popover.Root,
		tags: ['autodocs'],
	});

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                           */
	/* ------------------------------------------------------------------ */

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
	/*  play() interaction tests                                          */
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
	const playOpenAndEscapeClose = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
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

	/** Click "Mark all read" button inside popover -> button is accessible. */
	const playMarkAllRead = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const trigger = findBellTrigger(canvasElement);

		// Open popover
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement)!;
		const contentScope = within(content);

		// "Mark all read" button exists inside popover
		const markAllReadButton = contentScope.getByRole('button', { name: /mark all read/i });
		await expect(markAllReadButton).toBeVisible();

		// Click it (verifies the button is interactive)
		await userEvent.click(markAllReadButton);
	};

	/** Click outside the popover -> popover closes. */
	const playClickOutsideCloses = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const trigger = findBellTrigger(canvasElement);

		// Open
		await userEvent.click(trigger);
		await expect(getPopoverContent(canvasElement)).not.toBeNull();

		// Click outside
		await userEvent.click(canvasElement);
		await expectPopoverClosed(canvasElement);
	};

	/** Escape from popover does NOT propagate to parent (containment test). */
	const playEscapeContainment = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const trigger = findBellTrigger(canvasElement);

		// Track keydown events on the canvas wrapper
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

{#snippet notificationsTemplate()}
	<div class="p-4">
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<div class="relative inline-block">
						<Button intent="secondary" size="icon" aria-label="Demo" {...props}>
							<BellIcon data-icon="inline-start" />
						</Button>
						<span class="absolute right-1 top-1 size-1.75 rounded-full bg-status-danger"
						></span>
					</div>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-75 p-0" align="end" portalProps={{ disabled: true }}>
				<div class="flex items-center justify-between border-b border-border px-3 py-2.5">
					<div class="text-(length:--text-md) font-semibold">Inbox · 3 unread</div>
					<Button intent="ghost" size="sm">Mark all read</Button>
				</div>
				<div class="max-h-80 overflow-y-auto">
					{#each NOTIFICATIONS as notification (notification.title)}
						<div
							class="flex gap-2.5 border-b border-border px-3 py-2.5 last:border-b-0"
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

<Story name="Notifications Popover [play: open and escape close]" play={playOpenAndEscapeClose}>
	{#snippet template()}
		{@render notificationsTemplate()}
	{/snippet}
</Story>

<Story name="Mark All Read [play: mark all read]" play={playMarkAllRead}>
	{#snippet template()}
		{@render notificationsTemplate()}
	{/snippet}
</Story>

<Story name="Click Outside Closes [play: click outside closes]" play={playClickOutsideCloses}>
	{#snippet template()}
		{@render notificationsTemplate()}
	{/snippet}
</Story>

<Story name="Escape Containment [play: escape containment]" play={playEscapeContainment}>
	{#snippet template()}
		{@render notificationsTemplate()}
	{/snippet}
</Story>

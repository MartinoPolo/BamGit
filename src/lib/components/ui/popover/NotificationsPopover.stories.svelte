<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Popover from './index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';
	import BellIcon from '@lucide/svelte/icons/bell';

	const { Story } = defineMeta({
		title: 'UI/Patterns/NotificationsPopover',
		component: Popover.Root,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});

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

<Story name="Notifications Popover">
	{#snippet template()}
		<div class="p-4">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<div class="relative inline-block">
							<Button variant="secondary" size="icon" {...props}>
								<BellIcon class="size-3.5" />
							</Button>
							<span
								class="absolute right-1 top-1 size-[7px] rounded-full bg-status-danger"
							></span>
						</div>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-[300px] p-0" align="end" portalProps={{ disabled: true }}>
					<div
						class="flex items-center justify-between border-b border-border px-3 py-2.5"
					>
						<div class="text-[length:var(--text-md)] font-semibold">
							Inbox · 3 unread
						</div>
						<Button variant="ghost" size="sm">Mark all read</Button>
					</div>
					<div class="max-h-[320px] overflow-y-auto">
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
									<div
										class="mt-px text-[length:var(--text-2xs)] text-foreground-muted"
									>
										{notification.body}
									</div>
								</div>
								<div
									class="shrink-0 font-mono text-[length:var(--text-2xs)] text-foreground-subtle"
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
</Story>

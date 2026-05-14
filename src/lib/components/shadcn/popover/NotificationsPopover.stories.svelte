<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Popover from './index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';

	const { Story } = defineMeta({
		title: 'Blocks/NotificationsPopover',
		component: Popover.Root,
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
							<Button intent="secondary" size="icon" {...props}>
								<BellIcon class="size-3.5" />
							</Button>
							<span
								class="absolute right-1 top-1 size-1.75 rounded-full bg-status-danger"
							></span>
						</div>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-75 p-0" align="end" portalProps={{ disabled: true }}>
					<div
						class="flex items-center justify-between border-b border-border px-3 py-2.5"
					>
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
									<div
										class="mt-px text-(length:--text-2xs) text-foreground-muted"
									>
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
</Story>

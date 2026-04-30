<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Popover from './index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';
	import UserIcon from '@lucide/svelte/icons/user';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import GithubIcon from '@lucide/svelte/icons/git-branch';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	const { Story } = defineMeta({
		title: 'UI/Patterns/AccountDropdown',
		component: Popover.Root,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<Story name="Account Dropdown">
	{#snippet template()}
		<div class="p-4">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button variant="secondary" class="w-[280px] justify-between" {...props}>
							<span class="flex items-center gap-2">
								<span
									class="flex size-[22px] items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
								>
									L
								</span>
								Lukas
							</span>
							<ChevronDownIcon class="size-3.5" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-[280px] p-0" portalProps={{ disabled: true }}>
					<div class="flex items-center gap-2.5 border-b border-border px-3 py-3">
						<span
							class="flex size-8 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground"
						>
							L
						</span>
						<div class="min-w-0">
							<div class="text-[length:var(--text-md)] font-medium">Lukas Hron</div>
							<div
								class="truncate text-[length:var(--text-2xs)] text-foreground-subtle"
							>
								lukas@grovekeeper.dev
							</div>
						</div>
					</div>
					<div class="p-1.5">
						<Popover.Item>
							<UserIcon class="size-3.5" />
							Profile
							<span
								class="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-border bg-surface-2 px-[5px] font-mono text-[10.5px] text-foreground-muted"
							>
								⌘P
							</span>
						</Popover.Item>
						<Popover.Item>
							<SettingsIcon class="size-3.5" />
							Settings
							<span
								class="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-border bg-surface-2 px-[5px] font-mono text-[10.5px] text-foreground-muted"
							>
								⌘,
							</span>
						</Popover.Item>
						<Popover.Item>
							<DatabaseIcon class="size-3.5" />
							Billing &amp; usage
						</Popover.Item>
						<Popover.Divider />
						<Popover.Label>Theme</Popover.Label>
						<div class="flex gap-1 px-2 pb-1.5">
							<Button variant="secondary" size="sm" class="flex-1">
								<SunIcon class="size-3" />
								Light
							</Button>
							<Button variant="primary" size="sm" class="flex-1">
								<MoonIcon class="size-3" />
								Dark
							</Button>
							<Button variant="secondary" size="sm" class="flex-1">Auto</Button>
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
</Story>

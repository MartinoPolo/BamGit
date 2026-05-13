<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import {
		Popover,
		PopoverTrigger,
		PopoverContent,
		PopoverItem,
		PopoverDivider,
		PopoverLabel,
	} from './index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
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
		title: 'Blocks/AccountDropdown',
		component: Popover,
		tags: ['autodocs'],
	});
</script>

<Story name="Account Dropdown">
	{#snippet template()}
		<div class="p-4">
			<Popover>
				<PopoverTrigger>
					{#snippet child({ props })}
						<Button variant="secondary" class="w-70 justify-between" {...props}>
							<span class="flex items-center gap-2">
								<span
									class="flex size-5.5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
								>
									L
								</span>
								Lukas
							</span>
							<ChevronDownIcon class="size-3.5" />
						</Button>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent class="w-70 p-0" portalProps={{ disabled: true }}>
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
						<PopoverItem>
							<UserIcon class="size-3.5" />
							Profile
							<span
								class="ml-auto inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-1 border border-border bg-surface-2 px-1.25 font-mono text-[10.5px] text-foreground-muted"
							>
								⌘P
							</span>
						</PopoverItem>
						<PopoverItem>
							<SettingsIcon class="size-3.5" />
							Settings
							<span
								class="ml-auto inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-1 border border-border bg-surface-2 px-1.25 font-mono text-[10.5px] text-foreground-muted"
							>
								⌘,
							</span>
						</PopoverItem>
						<PopoverItem>
							<DatabaseIcon class="size-3.5" />
							Billing &amp; usage
						</PopoverItem>
						<PopoverDivider />
						<PopoverLabel>Theme</PopoverLabel>
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
						<PopoverDivider />
						<PopoverItem>
							<GlobeIcon class="size-3.5" />
							Workspaces
							<ChevronRightIcon class="ml-auto size-3" />
						</PopoverItem>
						<PopoverItem>
							<GithubIcon class="size-3.5" />
							GitHub integrations
						</PopoverItem>
						<PopoverDivider />
						<PopoverItem class="text-status-danger">
							<LogOutIcon class="size-3.5" />
							Sign out
						</PopoverItem>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	{/snippet}
</Story>

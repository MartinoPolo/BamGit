<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Popover from './index.js';
	import { Checkbox } from '$lib/components/shadcn/checkbox/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import CheckIcon from '@lucide/svelte/icons/check';

	const { Story } = defineMeta({
		title: 'Base/Popover',
		component: Popover.Root,
		tags: ['autodocs'],
	});
</script>

<Story name="Filter">
	{#snippet template()}
		<div class="flex items-start gap-4 p-4">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button variant="secondary" {...props}>
							<FilterIcon class="size-3.5" />
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
						<Button variant="ghost" size="sm" class="flex-1">Reset</Button>
						<Button variant="primary" size="sm" class="flex-1">Apply</Button>
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	{/snippet}
</Story>

<Story name="Sort">
	{#snippet template()}
		<div class="flex items-start gap-4 p-4">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button variant="secondary" {...props}>
							<LayersIcon class="size-3.5" />
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
		</div>
	{/snippet}
</Story>

<Story name="Legend">
	{#snippet template()}
		<div class="flex items-start gap-4 p-4">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button variant="secondary" {...props}>
							<SparklesIcon class="size-3.5" />
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

<Story name="Open by Default">
	{#snippet template()}
		<div class="flex items-start gap-4 p-4 pb-72">
			<Popover.Root open={true}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button variant="secondary" {...props}>
							<FilterIcon class="size-3.5" />
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
						<Button variant="ghost" size="sm" class="flex-1">Reset</Button>
						<Button variant="primary" size="sm" class="flex-1">Apply</Button>
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	{/snippet}
</Story>

<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { SearchField } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/SearchField',
		component: SearchField,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import type { SearchFieldProps } from './search-field-variants.js';
	import TreesIcon from '@lucide/svelte/icons/trees';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
</script>

<Story name="Rest">
	{#snippet template(args: SearchFieldProps)}
		<div class="max-w-xs">
			<SearchField placeholder="Search issues, branches…" {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Typing With Results">
	{#snippet template(args: SearchFieldProps)}
		<div class="max-w-xs">
			<SearchField value="forest" {...args}>
				<div
					class="mt-1.5 max-h-80 overflow-auto rounded-md border border-border bg-surface p-1.5 shadow-lg"
				>
					<div
						class="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-foreground-subtle"
					>
						Issues
					</div>
					<div
						class="flex cursor-pointer items-center gap-2 rounded-1 bg-primary-soft px-2 py-1.5 text-[12.5px] text-foreground"
					>
						<TreesIcon class="size-3" />
						#118 · Forest view overlays
						<span
							class="ml-auto inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-1 border border-border bg-surface-2 px-1.25 font-mono text-[10.5px] text-foreground-muted"
							>↵</span
						>
					</div>
					<div
						class="flex cursor-pointer items-center gap-2 rounded-1 px-2 py-1.5 text-[12.5px] text-foreground hover:bg-surface-2"
					>
						<TreesIcon class="size-3" />
						#128 · Forest tag centering
					</div>
					<div
						class="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-foreground-subtle"
					>
						Branches
					</div>
					<div
						class="flex cursor-pointer items-center gap-2 rounded-1 px-2 py-1.5 text-[12.5px] text-foreground hover:bg-surface-2"
					>
						<GitBranchIcon class="size-3" />
						feat/forest-overlays
					</div>
				</div>
			</SearchField>
		</div>
	{/snippet}
</Story>

<Story name="No Results">
	{#snippet template(args: SearchFieldProps)}
		<div class="max-w-xs">
			<SearchField value="qqzzqz" {...args}>
				<div
					class="mt-1.5 rounded-md border border-border bg-surface p-4.5 text-center shadow-lg"
				>
					<span class="text-[11px] text-foreground-subtle">No matches for "qqzzqz".</span>
				</div>
			</SearchField>
		</div>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template(args: SearchFieldProps)}
		<div class="grid max-w-2xl grid-cols-3 items-start gap-4">
			<div>
				<span class="mb-2 block text-xs text-foreground-subtle">Rest</span>
				<SearchField placeholder="Search issues, branches…" {...args} />
			</div>
			<div>
				<span class="mb-2 block text-xs text-foreground-subtle">Typing + results</span>
				<SearchField value="forest">
					<div
						class="mt-1.5 max-h-80 overflow-auto rounded-md border border-border bg-surface p-1.5 shadow-lg"
					>
						<div
							class="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-foreground-subtle"
						>
							Issues
						</div>
						<div
							class="flex cursor-pointer items-center gap-2 rounded-1 bg-primary-soft px-2 py-1.5 text-[12.5px] text-foreground"
						>
							<TreesIcon class="size-3" />
							#118 · Forest view overlays
						</div>
						<div
							class="flex cursor-pointer items-center gap-2 rounded-1 px-2 py-1.5 text-[12.5px] text-foreground hover:bg-surface-2"
						>
							<TreesIcon class="size-3" />
							#128 · Forest tag centering
						</div>
					</div>
				</SearchField>
			</div>
			<div>
				<span class="mb-2 block text-xs text-foreground-subtle">No results</span>
				<SearchField value="qqzzqz">
					<div
						class="mt-1.5 rounded-md border border-border bg-surface p-4.5 text-center shadow-lg"
					>
						<span class="text-[11px] text-foreground-subtle"
							>No matches for "qqzzqz".</span
						>
					</div>
				</SearchField>
			</div>
		</div>
	{/snippet}
</Story>

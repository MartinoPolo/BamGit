<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Tooltip from './index.js';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
	import { formatBindingForDisplay } from '$lib/modules/keyboard-shortcuts/index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';
	import SettingsIcon from '@lucide/svelte/icons/settings';

	const { Story } = defineMeta({
		title: 'Base/Tooltip',
		component: Tooltip.Provider,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<Story name="Top">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<button
							class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
						>
							Hover me
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content side="top" portalProps={{ disabled: true }}
						>Sync now</Tooltip.Content
					>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Bottom">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<button
							class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
						>
							Hover me
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content side="bottom" portalProps={{ disabled: true }}>
						Create issue
						<Kbd>{formatBindingForDisplay('Ctrl+N')}</Kbd>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Left">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<button
							class="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface-2 text-foreground"
						>
							<SettingsIcon class="size-3.5" />
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content side="left" portalProps={{ disabled: true }}
						>Filter issues</Tooltip.Content
					>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Right">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<button
							class="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface-2 text-foreground"
						>
							<SettingsIcon class="size-3.5" />
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" portalProps={{ disabled: true }}
						>Forest view</Tooltip.Content
					>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="With Kbd">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<button
							class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
						>
							Create issue
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content side="top" portalProps={{ disabled: true }}>
						Start a new agent session
						<Kbd>{formatBindingForDisplay('Ctrl+N')}</Kbd>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Rich">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<div
							class="flex size-14 items-center justify-center rounded-lg border border-border bg-surface-2 text-2xl"
						>
							🌳
						</div>
					</Tooltip.Trigger>
					<Tooltip.Content
						side="top"
						class="w-55 whitespace-normal p-2.5"
						portalProps={{ disabled: true }}
					>
						<div class="font-semibold">#128 · Build kanban DnD</div>
						<div class="mt-0.5 text-[10.5px] leading-undefined opacity-80">
							Claude · 2m 14s · 3 commits ahead
						</div>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Multi-line">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<button
							class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
						>
							Hover me
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content
						side="top"
						class="w-50 whitespace-normal"
						portalProps={{ disabled: true }}
					>
						Long tooltip text wraps onto multiple lines if it has to
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="All Placements">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="grid grid-cols-2 gap-16 p-20">
				<div class="flex items-center justify-center">
					<Tooltip.Root>
						<Tooltip.Trigger>
							<button
								class="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface-2 text-foreground"
							>
								<SettingsIcon class="size-3.5" />
							</button>
						</Tooltip.Trigger>
						<Tooltip.Content side="top" portalProps={{ disabled: true }}
							>Top · Sync now</Tooltip.Content
						>
					</Tooltip.Root>
				</div>
				<div class="flex items-center justify-center">
					<Tooltip.Root>
						<Tooltip.Trigger>
							<button
								class="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface-2 text-foreground"
							>
								<SettingsIcon class="size-3.5" />
							</button>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom" portalProps={{ disabled: true }}
							>Bottom · Create issue</Tooltip.Content
						>
					</Tooltip.Root>
				</div>
				<div class="flex items-center justify-center">
					<Tooltip.Root>
						<Tooltip.Trigger>
							<button
								class="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface-2 text-foreground"
							>
								<SettingsIcon class="size-3.5" />
							</button>
						</Tooltip.Trigger>
						<Tooltip.Content side="left" portalProps={{ disabled: true }}
							>Left · Filter issues</Tooltip.Content
						>
					</Tooltip.Root>
				</div>
				<div class="flex items-center justify-center">
					<Tooltip.Root>
						<Tooltip.Trigger>
							<button
								class="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface-2 text-foreground"
							>
								<SettingsIcon class="size-3.5" />
							</button>
						</Tooltip.Trigger>
						<Tooltip.Content side="right" portalProps={{ disabled: true }}
							>Right · Forest view</Tooltip.Content
						>
					</Tooltip.Root>
				</div>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

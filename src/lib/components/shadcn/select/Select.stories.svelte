<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Select } from './index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import { HelpText } from '$lib/components/base/help-text/index.js';

	const { Story } = defineMeta({
		title: 'Base/Select',
		component: Select,
		tags: ['autodocs'],
		argTypes: {
			state: {
				control: 'select',
				options: ['default', 'error'],
			},
			disabled: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { SelectProps } from './select-variants.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
</script>

<Story name="Default">
	{#snippet template(args: SelectProps)}
		<div class="max-w-xs">
			<Label for="prov">Provider</Label>
			<Select id="prov" {...args}>
				<option value="">Choose provider…</option>
				<option value="claude">Claude · Sonnet 4.5</option>
				<option value="codex">Codex · gpt-5</option>
				<option value="cursor">Cursor · auto</option>
			</Select>
		</div>
	{/snippet}
</Story>

<Story name="With Value">
	{#snippet template(args: SelectProps)}
		<div class="max-w-xs">
			<Label for="val">Provider</Label>
			<Select id="val" value="claude" {...args}>
				<option value="claude">Claude · Sonnet 4.5</option>
				<option value="codex">Codex · gpt-5</option>
				<option value="cursor">Cursor · auto</option>
			</Select>
		</div>
	{/snippet}
</Story>

<Story name="Error">
	{#snippet template(args: SelectProps)}
		<div class="max-w-xs">
			<Label for="err-sel">Provider</Label>
			<Select id="err-sel" state="error" value="" {...args}>
				<option value="">No provider configured</option>
			</Select>
			<HelpText status="error">Add a provider in Settings.</HelpText>
		</div>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template(args: SelectProps)}
		<div class="max-w-xs">
			<Label for="dis-sel">Provider</Label>
			<Select id="dis-sel" disabled value="claude" {...args}>
				<option value="claude">Claude · Sonnet 4.5</option>
			</Select>
		</div>
	{/snippet}
</Story>

<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<Story name="Custom Open Dropdown">
	{#snippet template(args: SelectProps)}
		<div class="relative max-w-70">
			<Label>Provider</Label>
			<button
				class="flex h-(--size-control-md) w-full cursor-default items-center justify-between rounded-md border border-ring bg-surface px-2.5 text-left font-sans text-(length:--text-md) text-foreground shadow-[0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)] outline-none"
			>
				<span>Claude · Sonnet 4.5</span>
				<ChevronDownIcon class="size-3.5 text-foreground-subtle" />
			</button>
			<div class="mt-1.5 rounded-lg border border-border bg-surface p-2 shadow-lg">
				<div
					class="flex cursor-pointer items-center gap-2 rounded-1.5 bg-primary-soft px-2 py-1.5 text-(length:--text-md) text-foreground"
				>
					<CheckIcon class="size-2.75" />
					Claude · Sonnet 4.5
				</div>
				<div
					class="flex cursor-pointer items-center gap-2 rounded-1.5 px-2 py-1.5 text-(length:--text-md) text-foreground hover:bg-surface-2"
				>
					<span class="inline-block w-2.75"></span>
					Claude · Haiku 4.5
				</div>
				<div
					class="flex cursor-pointer items-center gap-2 rounded-1.5 px-2 py-1.5 text-(length:--text-md) text-foreground hover:bg-surface-2"
				>
					<span class="inline-block w-2.75"></span>
					Codex · gpt-5
				</div>
				<div
					class="flex cursor-pointer items-center gap-2 rounded-1.5 px-2 py-1.5 text-(length:--text-md) text-foreground hover:bg-surface-2"
				>
					<span class="inline-block w-2.75"></span>
					Cursor · auto
				</div>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template(args: SelectProps)}
		<div class="grid max-w-2xl grid-cols-3 gap-4">
			<div>
				<Label>Default</Label>
				<Select {...args}>
					<option>Choose provider…</option>
				</Select>
			</div>
			<div>
				<Label>Value</Label>
				<Select value="claude">
					<option value="claude">Claude · Sonnet 4.5</option>
				</Select>
			</div>
			<div>
				<Label>Focus (interact)</Label>
				<Select value="claude">
					<option value="claude">Claude · Sonnet 4.5</option>
				</Select>
			</div>
			<div>
				<Label>Disabled</Label>
				<Select disabled value="claude">
					<option value="claude">Claude · Sonnet 4.5</option>
				</Select>
			</div>
			<div>
				<Label>Error</Label>
				<Select state="error" value="">
					<option value="">No provider configured</option>
				</Select>
				<HelpText status="error">Add a provider in Settings.</HelpText>
			</div>
		</div>
	{/snippet}
</Story>

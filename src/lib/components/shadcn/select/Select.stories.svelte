<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { SELECT_STATES, Select } from './index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import { HelpText } from '$lib/components/base/help-text/index.js';

	const { Story } = defineMeta({
		title: 'Base/Select',
		component: Select,
		tags: ['autodocs'],
		argTypes: {
			state: {
				control: 'select',
				options: [...SELECT_STATES],
			},
			disabled: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { SelectProps } from './select-variants.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as SelectCustom from './index.js';

	const providers = [
		{ value: 'claude-sonnet', label: 'Claude · Sonnet 4.5' },
		{ value: 'claude-haiku', label: 'Claude · Haiku 4.5' },
		{ value: 'codex-gpt5', label: 'Codex · gpt-5' },
		{ value: 'cursor-auto', label: 'Cursor · auto' },
	];
	const anthropic = [
		{ value: 'claude-sonnet', label: 'Claude · Sonnet 4.5' },
		{ value: 'claude-haiku', label: 'Claude · Haiku 4.5' },
	];
	const openai = [
		{ value: 'codex-gpt5', label: 'Codex · gpt-5' },
		{ value: 'gpt4o', label: 'GPT-4o' },
	];
	const providersWithDisabled = [
		{ value: 'claude-sonnet', label: 'Claude · Sonnet 4.5', disabled: false },
		{ value: 'claude-haiku', label: 'Claude · Haiku 4.5', disabled: false },
		{ value: 'codex-gpt5', label: 'Codex · gpt-5 (unavailable)', disabled: true },
		{ value: 'cursor-auto', label: 'Cursor · auto', disabled: false },
	];

	let selectedDefault = $state<string | undefined>(undefined);
	const selectedDefaultLabel = $derived(
		providers.find((i) => i.value === selectedDefault)?.label ?? 'Choose provider…',
	);

	let selectedWithValue = $state('claude-sonnet');
	const selectedWithValueLabel = $derived(
		providers.find((i) => i.value === selectedWithValue)?.label ?? 'Choose provider…',
	);

	let selectedError = $state<string | undefined>(undefined);

	let selectedGroups = $state<string | undefined>(undefined);
	const allGroupItems = [...anthropic, ...openai];
	const selectedGroupsLabel = $derived(
		allGroupItems.find((i) => i.value === selectedGroups)?.label ?? 'Choose provider…',
	);

	let selectedWithDisabled = $state<string | undefined>(undefined);
	const selectedWithDisabledLabel = $derived(
		providersWithDisabled.find((i) => i.value === selectedWithDisabled)?.label ??
			'Choose provider…',
	);
</script>

<Story name="All Variants">
	{#snippet template(args: SelectProps)}
		<div class="grid max-w-2xl grid-cols-2 gap-4">
			{#each SELECT_STATES as state (state)}
				<div>
					<Label>{state}</Label>
					<Select {...args} {state} value={state === 'error' ? '' : 'claude'}>
						<option value="">Choose provider...</option>
						<option value="claude">Claude - Sonnet 4.5</option>
					</Select>
					{#if state === 'error'}
						<HelpText state="error">Add a provider in Settings.</HelpText>
					{/if}
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

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
			<HelpText state="error">Add a provider in Settings.</HelpText>
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

<!-- ─── Custom (bits-ui) Select Stories ──────────────────────────────────── -->

<Story name="Custom · Default">
	{#snippet template()}
		<div class="max-w-xs">
			<Label>Provider</Label>
			<SelectCustom.CustomRoot type="single" bind:value={selectedDefault}>
				<SelectCustom.CustomTrigger>{selectedDefaultLabel}</SelectCustom.CustomTrigger>
				<SelectCustom.CustomContent portalProps={{ disabled: true }}>
					{#each providers as item (item.value)}
						<SelectCustom.CustomItem value={item.value} label={item.label} />
					{/each}
				</SelectCustom.CustomContent>
			</SelectCustom.CustomRoot>
		</div>
	{/snippet}
</Story>

<Story name="Custom · With Value">
	{#snippet template()}
		<div class="max-w-xs">
			<Label>Provider</Label>
			<SelectCustom.CustomRoot type="single" bind:value={selectedWithValue}>
				<SelectCustom.CustomTrigger>{selectedWithValueLabel}</SelectCustom.CustomTrigger>
				<SelectCustom.CustomContent portalProps={{ disabled: true }}>
					{#each providers as item (item.value)}
						<SelectCustom.CustomItem value={item.value} label={item.label} />
					{/each}
				</SelectCustom.CustomContent>
			</SelectCustom.CustomRoot>
		</div>
	{/snippet}
</Story>

<Story name="Custom · Error">
	{#snippet template()}
		<div class="max-w-xs">
			<Label>Provider</Label>
			<SelectCustom.CustomRoot type="single" bind:value={selectedError}>
				<SelectCustom.CustomTrigger state="error">
					{selectedError ?? 'No provider configured'}
				</SelectCustom.CustomTrigger>
				<SelectCustom.CustomContent portalProps={{ disabled: true }}>
					<SelectCustom.CustomItem value="claude-sonnet" label="Claude · Sonnet 4.5" />
				</SelectCustom.CustomContent>
			</SelectCustom.CustomRoot>
			<HelpText state="error">Add a provider in Settings.</HelpText>
		</div>
	{/snippet}
</Story>

<Story name="Custom · Disabled">
	{#snippet template()}
		<div class="max-w-xs">
			<Label>Provider</Label>
			<SelectCustom.CustomRoot type="single" value="claude-sonnet" disabled>
				<SelectCustom.CustomTrigger>Claude · Sonnet 4.5</SelectCustom.CustomTrigger>
				<SelectCustom.CustomContent portalProps={{ disabled: true }}>
					<SelectCustom.CustomItem value="claude-sonnet" label="Claude · Sonnet 4.5" />
				</SelectCustom.CustomContent>
			</SelectCustom.CustomRoot>
		</div>
	{/snippet}
</Story>

<Story name="Custom · With Groups">
	{#snippet template()}
		<div class="max-w-xs">
			<Label>Provider</Label>
			<SelectCustom.CustomRoot type="single" bind:value={selectedGroups}>
				<SelectCustom.CustomTrigger>{selectedGroupsLabel}</SelectCustom.CustomTrigger>
				<SelectCustom.CustomContent portalProps={{ disabled: true }}>
					<SelectCustom.CustomGroup>
						<SelectCustom.CustomGroupHeading>Anthropic</SelectCustom.CustomGroupHeading>
						{#each anthropic as item (item.value)}
							<SelectCustom.CustomItem value={item.value} label={item.label} />
						{/each}
					</SelectCustom.CustomGroup>
					<SelectCustom.CustomSeparator />
					<SelectCustom.CustomGroup>
						<SelectCustom.CustomGroupHeading>OpenAI</SelectCustom.CustomGroupHeading>
						{#each openai as item (item.value)}
							<SelectCustom.CustomItem value={item.value} label={item.label} />
						{/each}
					</SelectCustom.CustomGroup>
				</SelectCustom.CustomContent>
			</SelectCustom.CustomRoot>
		</div>
	{/snippet}
</Story>

<Story name="Custom · Disabled Item">
	{#snippet template()}
		<div class="max-w-xs">
			<Label>Provider</Label>
			<SelectCustom.CustomRoot type="single" bind:value={selectedWithDisabled}>
				<SelectCustom.CustomTrigger>{selectedWithDisabledLabel}</SelectCustom.CustomTrigger>
				<SelectCustom.CustomContent portalProps={{ disabled: true }}>
					{#each providersWithDisabled as item (item.value)}
						<SelectCustom.CustomItem
							value={item.value}
							label={item.label}
							disabled={item.disabled}
						/>
					{/each}
				</SelectCustom.CustomContent>
			</SelectCustom.CustomRoot>
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
				<HelpText state="error">Add a provider in Settings.</HelpText>
			</div>
		</div>
	{/snippet}
</Story>

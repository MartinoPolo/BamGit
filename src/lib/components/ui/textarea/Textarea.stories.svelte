<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Textarea } from './index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { HelpText } from '$lib/components/ui/help-text/index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'UI/Textarea',
		component: Textarea,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
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
	import type { TextareaProps } from './textarea-variants.js';
</script>

<Story name="Default">
	{#snippet template(args: TextareaProps)}
		<div class="max-w-sm">
			<Label for="desc">Description</Label>
			<Textarea id="desc" rows={3} placeholder="Describe the change…" {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Filled">
	{#snippet template(args: TextareaProps)}
		<div class="max-w-sm">
			<Label for="filled">Description</Label>
			<Textarea
				id="filled"
				rows={3}
				value="Surface session failures and PR review state directly above each tree."
				{...args}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Error">
	{#snippet template(args: TextareaProps)}
		<div class="max-w-sm">
			<Label for="error-ta">Description</Label>
			<Textarea id="error-ta" state="error" rows={2} value="" {...args} />
			<HelpText status="error">Description is required.</HelpText>
		</div>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template(args: TextareaProps)}
		<div class="max-w-sm">
			<Label for="disabled-ta">Description</Label>
			<Textarea
				id="disabled-ta"
				disabled
				rows={3}
				value="Locked while session running"
				{...args}
			/>
		</div>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template(_args: TextareaProps)}
		<div class="grid max-w-2xl grid-cols-2 gap-4">
			<div>
				<Label>Default</Label>
				<Textarea rows={3} placeholder="Describe the change…" />
			</div>
			<div>
				<Label>Focus (interact)</Label>
				<Textarea
					rows={3}
					value="Surface session failures and PR review state directly above each tree."
				/>
			</div>
			<div>
				<Label>Error</Label>
				<Textarea state="error" rows={2} />
				<HelpText status="error">Description is required.</HelpText>
			</div>
			<div>
				<Label>Disabled</Label>
				<Textarea disabled rows={3} value="Locked while session running" />
			</div>
		</div>
	{/snippet}
</Story>

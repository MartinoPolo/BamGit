<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Label } from './index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { HelpText } from '$lib/components/ui/help-text/index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Base/Label',
		component: Label,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import type { LabelProps } from './label-variants.js';
</script>

<Story name="Default">
	{#snippet template(args: LabelProps)}
		<Label {...args}>Issue title</Label>
	{/snippet}
</Story>

<Story name="With Input">
	{#snippet template(args: LabelProps)}
		<div class="max-w-xs">
			<Label for="demo-input" {...args}>Branch name</Label>
			<Input id="demo-input" placeholder="feat/my-feature" />
		</div>
	{/snippet}
</Story>

<Story name="With HelpText Success">
	{#snippet template(args: LabelProps)}
		<div class="max-w-xs">
			<Label for="success-input" {...args}>Branch name</Label>
			<Input id="success-input" state="success" value="feat/valid-name" />
			<HelpText status="success">Branch is available.</HelpText>
		</div>
	{/snippet}
</Story>

<Story name="With HelpText Error">
	{#snippet template(args: LabelProps)}
		<div class="max-w-xs">
			<Label for="error-input" {...args}>Branch name</Label>
			<Input id="error-input" state="error" value="feat/forest overlays" />
			<HelpText status="error">Branch names cannot contain spaces.</HelpText>
		</div>
	{/snippet}
</Story>

<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<Story name="HelpText Variants">
	{#snippet template(args: LabelProps)}
		<div class="flex flex-col gap-4">
			<HelpText>Default help text with additional guidance.</HelpText>
			<HelpText status="success">Branch is available.</HelpText>
			<HelpText status="error">Branch names cannot contain spaces.</HelpText>
		</div>
	{/snippet}
</Story>

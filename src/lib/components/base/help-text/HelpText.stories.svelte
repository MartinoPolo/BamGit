<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { HelpText } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/HelpText',
		component: HelpText,
		tags: ['autodocs'],
		argTypes: {
			status: {
				control: 'select',
				options: ['default', 'error', 'success'],
			},
		},
	});
</script>

<script lang="ts">
	import type { HelpTextProps } from './help-text-variants.js';
</script>

<Story name="Default" args={{ status: 'default' }}>
	{#snippet template(args: HelpTextProps)}
		<div class="w-80">
			<HelpText {...args}>Enter a value between 1 and 100.</HelpText>
		</div>
	{/snippet}
</Story>

<Story name="Error State" args={{ status: 'error' }}>
	{#snippet template(args: HelpTextProps)}
		<div class="w-80">
			<HelpText {...args}>This field is required.</HelpText>
		</div>
	{/snippet}
</Story>

<Story name="Success State" args={{ status: 'success' }}>
	{#snippet template(args: HelpTextProps)}
		<div class="w-80">
			<HelpText {...args}>Your changes have been saved successfully.</HelpText>
		</div>
	{/snippet}
</Story>

<Story name="Long Text" args={{ status: 'default' }}>
	{#snippet template(args: HelpTextProps)}
		<div class="w-80">
			<HelpText {...args}>
				This is a longer help text message that is intended to wrap across multiple lines
				when displayed inside a constrained container width.
			</HelpText>
		</div>
	{/snippet}
</Story>

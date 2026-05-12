<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Input } from './index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import { HelpText } from '$lib/components/base/help-text/index.js';

	const { Story } = defineMeta({
		title: 'Base/Input',
		component: Input,
		tags: ['autodocs'],
		argTypes: {
			state: {
				control: 'select',
				options: ['default', 'success', 'error', 'loading'],
			},
			disabled: { control: 'boolean' },
			readonly: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { InputProps } from './input-variants.js';
</script>

<Story name="Default" args={{ state: 'default' }}>
	{#snippet template(args: InputProps)}
		<div class="max-w-xs">
			<Input placeholder="Branch name" {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Filled">
	{#snippet template(args: InputProps)}
		<div class="max-w-xs">
			<Input value="feat/forest-overlays" {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Success">
	{#snippet template(args: InputProps)}
		<div class="max-w-xs">
			<Label for="success-demo">Branch name</Label>
			<Input id="success-demo" state="success" value="feat/valid-name" {...args} />
			<HelpText status="success">Branch is available.</HelpText>
		</div>
	{/snippet}
</Story>

<Story name="Error">
	{#snippet template(args: InputProps)}
		<div class="max-w-xs">
			<Label for="error-demo">Branch name</Label>
			<Input id="error-demo" state="error" value="feat/forest overlays" {...args} />
			<HelpText status="error">Branch names cannot contain spaces.</HelpText>
		</div>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template(args: InputProps)}
		<div class="max-w-xs">
			<Input disabled value="feat/locked-branch" {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Read Only">
	{#snippet template(args: InputProps)}
		<div class="max-w-xs">
			<Input readonly value="main" {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Loading">
	{#snippet template(args: InputProps)}
		<div class="max-w-xs">
			<Input state="loading" value="resolving…" {...args} />
		</div>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template(args: InputProps)}
		<div class="grid max-w-2xl grid-cols-3 gap-4">
			<div>
				<Label>Default</Label>
				<Input placeholder="Branch name" {...args} />
			</div>
			<div>
				<Label>Filled</Label>
				<Input value="feat/forest-overlays" />
			</div>
			<div>
				<Label>Focus (interact)</Label>
				<Input value="feat/forest-overlays" />
			</div>
			<div>
				<Label>Success</Label>
				<Input state="success" value="feat/valid-name" />
				<HelpText status="success">Branch is available.</HelpText>
			</div>
			<div>
				<Label>Error</Label>
				<Input state="error" value="feat/forest overlays" />
				<HelpText status="error">Branch names cannot contain spaces.</HelpText>
			</div>
			<div>
				<Label>Disabled</Label>
				<Input disabled value="feat/locked-branch" />
			</div>
			<div>
				<Label>Read-only</Label>
				<Input readonly value="main" />
			</div>
			<div>
				<Label>Loading</Label>
				<Input state="loading" value="resolving…" />
			</div>
		</div>
	{/snippet}
</Story>

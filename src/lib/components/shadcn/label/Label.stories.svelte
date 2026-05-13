<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Label } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Label',
		component: Label,
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

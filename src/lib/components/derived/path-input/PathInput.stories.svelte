<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PathInput from './PathInput.svelte';

	const { Story } = defineMeta({
		title: 'Derived/PathInput',
		component: PathInput,
		tags: ['autodocs'],
		argTypes: {
			placeholder: { control: 'text' },
			disabled: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	let emptyValue = $state('');
	let prefilledValue = $state('/home/user/projects/myapp');
	let placeholderValue = $state('');
	let disabledValue = $state('/home/user/projects/myapp');
</script>

<Story name="Empty" args={{}}>
	{#snippet template()}
		<div class="w-80">
			<PathInput bind:value={emptyValue} />
		</div>
	{/snippet}
</Story>

<Story name="Prefilled Path" args={{}}>
	{#snippet template()}
		<div class="w-80">
			<PathInput bind:value={prefilledValue} />
		</div>
	{/snippet}
</Story>

<Story name="With Custom Placeholder" args={{}}>
	{#snippet template()}
		<div class="w-80">
			<PathInput bind:value={placeholderValue} placeholder="Select project root folder…" />
		</div>
	{/snippet}
</Story>

<Story name="Disabled" args={{}}>
	{#snippet template()}
		<div class="w-80">
			<PathInput bind:value={disabledValue} disabled />
		</div>
	{/snippet}
</Story>

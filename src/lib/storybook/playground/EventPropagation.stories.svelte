<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import EventPropagationPlayground from './EventPropagationPlayground.svelte';

	const { Story } = defineMeta({
		title: 'Playground/Event Propagation',
		component: EventPropagationPlayground,
	});
</script>

<Story name="Default">
	{#snippet template()}
		<EventPropagationPlayground />
	{/snippet}
</Story>

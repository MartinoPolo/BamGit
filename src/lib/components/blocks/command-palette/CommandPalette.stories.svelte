<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CommandPaletteStoryWrapper from './CommandPaletteStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/CommandPalette',
		component: CommandPaletteStoryWrapper,
		tags: ['autodocs'],
	});
</script>

<Story name="Open">
	{#snippet template()}
		<CommandPaletteStoryWrapper>
			<div class="h-100 w-full"></div>
		</CommandPaletteStoryWrapper>
	{/snippet}
</Story>

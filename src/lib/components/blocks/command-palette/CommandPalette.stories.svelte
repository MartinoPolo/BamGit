<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CommandPaletteStoryWrapper from './CommandPaletteStoryWrapper.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/CommandPalette',
		component: CommandPaletteStoryWrapper,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
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

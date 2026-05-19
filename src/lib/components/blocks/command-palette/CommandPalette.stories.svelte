<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CommandPaletteStoryWrapper from './CommandPaletteStoryWrapper.svelte';
	import StoryKeyboardHints from '$lib/storybook/StoryKeyboardHints.svelte';
	import KeyboardHint from '$lib/storybook/KeyboardHint.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/CommandPalette',
		component: CommandPaletteStoryWrapper,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import CommandPalette from './CommandPalette.svelte';

	let isMounted = $state(false);

	onMount(() => {
		isMounted = true;
	});
</script>

<Story name="Default">
	{#if isMounted}
		<div style="width: 100%; height: 100vh">
			<CommandPalette />
		</div>
	{/if}
</Story>

<Story name="With Open State">
	{#if isMounted}
		<div style="width: 100%; height: 100vh">
			<CommandPalette />
		</div>
	{/if}
</Story>

<Story name="Keyboard Hints">
	<StoryKeyboardHints>
		<KeyboardHint keys="Cmd/Ctrl + K" action="Open command palette" />
		<KeyboardHint keys="↑/↓" action="Navigate commands" />
		<KeyboardHint keys="Enter" action="Execute selected command" />
		<KeyboardHint keys="Esc" action="Close palette" />
	</StoryKeyboardHints>
</Story>

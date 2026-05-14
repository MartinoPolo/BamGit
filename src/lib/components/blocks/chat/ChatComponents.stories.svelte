<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StreamingCaret from './StreamingCaret.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Chat/ChatComponents',
		component: StreamingCaret,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import InlineImage from './InlineImage.svelte';
</script>

<Story name="Streaming Caret">
	{#snippet template()}
		<div class="mx-auto max-w-225">
			<p class="text-[13px] text-foreground">
				Some text with a streaming indicator<StreamingCaret />
			</p>
		</div>
	{/snippet}
</Story>

<Story name="Inline Image">
	{#snippet template()}
		<div class="mx-auto flex max-w-225 gap-4">
			<InlineImage
				src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='120'><rect fill='%23334155' width='200' height='120' rx='8'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14'>Image #1</text></svg>"
				imageNumber={1}
			/>
			<InlineImage
				src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='120'><rect fill='%231e3a5f' width='200' height='120' rx='8'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14'>Image #2</text></svg>"
				imageNumber={2}
			/>
		</div>
	{/snippet}
</Story>

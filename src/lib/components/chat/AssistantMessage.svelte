<script lang="ts">
	import { renderMarkdown } from '$lib/modules/chat/index.js';
	import StreamingCaret from './StreamingCaret.svelte';

	interface Props {
		content: string;
		streaming?: boolean;
	}

	let { content, streaming = false }: Props = $props();

	const renderedHtml = $derived(streaming ? '' : renderMarkdown(content));
</script>

<div class="assistant-message text-[13px] leading-[1.6] text-foreground">
	{#if streaming}
		<span class="whitespace-pre-wrap">{content}</span><StreamingCaret />
	{:else}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html renderedHtml}
	{/if}
</div>

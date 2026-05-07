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
		{@html renderedHtml}
	{/if}
</div>

<style>
	.assistant-message :global(h1) {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0.75em 0 0.25em;
		line-height: 1.3;
	}
	.assistant-message :global(h2) {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0.6em 0 0.2em;
		line-height: 1.35;
	}
	.assistant-message :global(h3) {
		font-size: 1rem;
		font-weight: 600;
		margin: 0.5em 0 0.15em;
		line-height: 1.4;
	}
	.assistant-message :global(p) {
		margin: 0.35em 0;
	}
	.assistant-message :global(ul),
	.assistant-message :global(ol) {
		margin: 0.35em 0;
		padding-left: 1.5em;
	}
	.assistant-message :global(li) {
		margin: 0.15em 0;
	}
	.assistant-message :global(code) {
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 1px 5px;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 4px;
	}
	.assistant-message :global(pre) {
		margin: 0.5em 0;
		padding: 10px 12px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow-x: auto;
	}
	.assistant-message :global(pre code) {
		padding: 0;
		background: none;
		border: none;
		border-radius: 0;
		font-size: 11.5px;
		line-height: 1.55;
		color: var(--foreground-muted);
	}
	.assistant-message :global(table) {
		border-collapse: collapse;
		margin: 0.5em 0;
		font-size: 12px;
		width: 100%;
	}
	.assistant-message :global(th),
	.assistant-message :global(td) {
		border: 1px solid var(--border);
		padding: 4px 8px;
		text-align: left;
	}
	.assistant-message :global(th) {
		background: var(--surface-2);
		font-weight: 600;
	}
	.assistant-message :global(a) {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.assistant-message :global(a:hover) {
		opacity: 0.8;
	}
	.assistant-message :global(blockquote) {
		border-left: 3px solid var(--border);
		margin: 0.5em 0;
		padding: 0.25em 0.75em;
		color: var(--foreground-muted);
	}
	.assistant-message :global(del) {
		opacity: 0.6;
	}
	.assistant-message :global(strong) {
		font-weight: 600;
	}
</style>

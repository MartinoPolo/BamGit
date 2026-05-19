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

<div class="assistant-message text-[13px] leading-undefined text-foreground">
	{#if streaming}
		<span class="whitespace-pre-wrap">{content}</span><StreamingCaret />
	{:else}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html renderedHtml}
	{/if}
</div>

<style>
	:global(.assistant-message h1) {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0.75em 0 0.25em;
		line-height: 1.3;
	}

	:global(.assistant-message h2) {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0.6em 0 0.2em;
		line-height: 1.35;
	}

	:global(.assistant-message h3) {
		font-size: 1rem;
		font-weight: 600;
		margin: 0.5em 0 0.15em;
		line-height: 1.4;
	}

	:global(.assistant-message p) {
		margin: 0.35em 0;
	}

	:global(.assistant-message ul),
	:global(.assistant-message ol) {
		margin: 0.35em 0;
		padding-left: 1.5em;
	}

	:global(.assistant-message li) {
		margin: 0.15em 0;
	}

	:global(.assistant-message code) {
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 1px 5px;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 4px;
	}

	:global(.assistant-message pre) {
		margin: 0.5em 0;
		padding: 10px 12px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow-x: auto;
	}

	:global(.assistant-message pre code) {
		padding: 0;
		background: none;
		border: none;
		border-radius: 0;
		font-size: 11.5px;
		line-height: 1.55;
		color: var(--foreground-muted);
	}

	:global(.assistant-message table) {
		border-collapse: collapse;
		margin: 0.5em 0;
		font-size: 12px;
		width: 100%;
	}

	:global(.assistant-message th),
	:global(.assistant-message td) {
		border: 1px solid var(--border);
		padding: 4px 8px;
		text-align: left;
	}

	:global(.assistant-message th) {
		background: var(--surface-2);
		font-weight: 600;
	}

	:global(.assistant-message a) {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.assistant-message a:hover) {
		opacity: 0.8;
	}

	:global(.assistant-message blockquote) {
		border-left: 3px solid var(--border);
		margin: 0.5em 0;
		padding: 0.25em 0.75em;
		color: var(--foreground-muted);
	}

	:global(.assistant-message del) {
		opacity: 0.6;
	}

	:global(.assistant-message strong) {
		font-weight: 600;
	}
</style>

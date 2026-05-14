<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';

	interface Props {
		code: string;
		language?: string;
	}

	let { code, language }: Props = $props();

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | undefined;

	async function handleCopy(event: MouseEvent) {
		event.stopPropagation();
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// clipboard API may be unavailable
		}
	}

	onDestroy(() => {
		clearTimeout(copyTimeout);
	});
</script>

<div class="group/code relative my-2 overflow-hidden rounded-md border border-border bg-surface-2">
	<div class="flex items-center justify-between border-b border-border px-3 py-1.5">
		{#if language}
			<Badge format="mono">{language}</Badge>
		{:else}
			<span></span>
		{/if}
		<Button
			intent="ghost"
			size="icon-sm"
			onclick={handleCopy}
			aria-label={copied ? m.chat_copied() : m.chat_copy_code()}
		>
			{#if copied}
				<CheckIcon class="text-status-success" data-icon="inline-start" />
			{:else}
				<CopyIcon data-icon="inline-start" />
			{/if}
		</Button>
	</div>
	<pre class="overflow-x-auto p-3"><code
			class="font-mono text-[11.5px] leading-relaxed text-foreground-muted">{code}</code
		></pre>
</div>

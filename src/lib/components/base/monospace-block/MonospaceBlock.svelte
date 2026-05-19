<script lang="ts">
	import { onDestroy } from 'svelte';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		content: string;
		maxHeight?: string;
		copyButton?: boolean;
		class?: string;
	}

	let { content, maxHeight, copyButton = false, class: className }: Props = $props();

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | undefined;

	async function handleCopy(event: MouseEvent) {
		event.stopPropagation();
		try {
			await navigator.clipboard.writeText(content);
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

	const preClasses = $derived(
		cn(
			'bg-surface-2 border border-border rounded-md p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-foreground',
			maxHeight !== undefined && 'overflow-y-auto',
			className,
		),
	);

	const preStyle = $derived(maxHeight !== undefined ? `max-height: ${maxHeight}` : undefined);
</script>

{#if copyButton}
	<div class="relative">
		<pre class={preClasses} style={preStyle}>{content}</pre>
		<div class="absolute top-1.5 right-1.5">
			<Button
				intent="ghost"
				size="icon-sm"
				onclick={handleCopy}
				aria-label={copied ? 'Copied' : 'Copy'}
			>
				{#if copied}
					<CheckIcon class="text-status-success" data-icon="inline-start" />
				{:else}
					<CopyIcon data-icon="inline-start" />
				{/if}
			</Button>
		</div>
	</div>
{:else}
	<pre class={preClasses} style={preStyle}>{content}</pre>
{/if}

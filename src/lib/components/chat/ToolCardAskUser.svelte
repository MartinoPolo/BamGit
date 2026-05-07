<script lang="ts">
	import type { ChatMessage } from '$lib/modules/chat/index.js';
	import CompassIcon from '@lucide/svelte/icons/compass';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';

	interface Props {
		message: ChatMessage;
		onConfirm?: (selectedIndex: number) => void;
	}

	let { message, onConfirm }: Props = $props();

	let selectedValue = $state('0');

	const selectedIndex = $derived(parseInt(selectedValue, 10));

	const options = $derived.by(() => {
		if (
			typeof message.toolInput === 'object' &&
			message.toolInput !== null &&
			!Array.isArray(message.toolInput)
		) {
			const input = message.toolInput as Record<string, unknown>;
			if (Array.isArray(input.options)) {
				return input.options.filter((o): o is string => typeof o === 'string');
			}
		}
		return [];
	});

	const question = $derived.by(() => {
		if (
			typeof message.toolInput === 'object' &&
			message.toolInput !== null &&
			!Array.isArray(message.toolInput)
		) {
			const input = message.toolInput as Record<string, unknown>;
			if (typeof input.question === 'string') {
				return input.question;
			}
		}
		return message.content || 'Select an option';
	});
</script>

<Card.Card padding="none" class="overflow-hidden">
	<!-- Header -->
	<div class="flex h-9 items-center gap-2 border-b border-border bg-surface-2 px-3">
		<CompassIcon size={13} strokeWidth={1.8} class="text-foreground-muted" />
		<span class="text-xs font-semibold">Agent asks</span>
	</div>

	<!-- Content -->
	<div class="px-3 py-2.5">
		<div class="mb-2.5 text-[13px] leading-[1.5] text-foreground">
			{question}
		</div>
		{#if options.length > 0}
			<RadioGroup.Root bind:value={selectedValue} class="mb-2.5 gap-1">
				{#each options as option, i (i)}
					<label
						class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-[5px] text-[12.5px]"
						class:bg-primary-soft={selectedIndex === i}
						style={selectedIndex === i
							? 'border: 1px solid color-mix(in oklch, var(--primary) 30%, var(--border))'
							: 'border: 1px solid transparent'}
					>
						<RadioGroup.Item value={String(i)} />
						<span>{option}</span>
					</label>
				{/each}
			</RadioGroup.Root>
		{/if}
		<Button variant="primary" size="sm" onclick={() => onConfirm?.(selectedIndex)}>
			Confirm <Kbd class="ml-1">↵</Kbd>
		</Button>
	</div>
</Card.Card>

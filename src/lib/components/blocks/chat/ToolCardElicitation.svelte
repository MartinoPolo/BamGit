<script lang="ts">
	import type { ChatMessage } from '$lib/modules/chat/index.js';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';

	interface Props {
		message: ChatMessage;
		onSubmit?: (value: string) => void;
		onCancel?: () => void;
	}

	let { message, onSubmit, onCancel }: Props = $props();

	let inputValue = $state('');

	const serverName = $derived.by(() => {
		if (
			typeof message.toolInput === 'object' &&
			message.toolInput !== null &&
			!Array.isArray(message.toolInput)
		) {
			const input = message.toolInput as Record<string, unknown>;
			if (typeof input.server === 'string') {
				return input.server;
			}
		}
		return 'MCP Server';
	});

	function handleSubmit() {
		if (inputValue.trim()) {
			onSubmit?.(inputValue.trim());
			inputValue = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSubmit();
		}
		if (event.key === 'Escape') {
			event.preventDefault();
			onCancel?.();
		}
	}
</script>

<div
	class="overflow-hidden rounded-lg border bg-surface"
	style="border-color: color-mix(in oklch, var(--status-info) 40%, var(--border))"
>
	<!-- Header -->
	<div
		class="flex h-9 items-center gap-2 border-b px-3"
		style="background: color-mix(in oklch, var(--status-info) 8%, var(--surface-2)); border-color: color-mix(in oklch, var(--status-info) 30%, var(--border))"
	>
		<DatabaseIcon size={13} strokeWidth={1.8} class="text-status-info" />
		<span class="text-xs font-semibold">MCP: {serverName}</span>
	</div>

	<!-- Content -->
	<div class="flex">
		<div class="w-0.75 shrink-0 bg-status-info"></div>
		<div class="flex-1 px-3 py-2.5">
			<div class="mb-2.5 text-[13px] leading-normal text-foreground">
				{message.content}
			</div>
			<div class="flex items-center gap-1.5">
				<Input
					class="max-w-80 flex-1 text-xs"
					placeholder="Enter value…"
					bind:value={inputValue}
					onkeydown={handleKeydown}
				/>
				<Button
					intent="primary"
					size="sm"
					class="h-(--size-control-md)"
					onclick={handleSubmit}
				>
					Submit <Kbd format="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
				</Button>
				<Button intent="ghost" size="sm" class="h-(--size-control-md)" onclick={onCancel}
					>Cancel</Button
				>
			</div>
		</div>
	</div>
</div>

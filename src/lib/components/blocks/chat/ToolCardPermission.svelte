<script lang="ts">
	import type { ChatMessage } from '$lib/modules/chat/index.js';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Kbd, KbdGroup } from '$lib/components/shadcn/kbd/index.js';
	import { MonospaceBlock } from '$lib/components/base/monospace-block/index.js';
	import { extractToolDetail, getToolAccentColor } from './tool_card_utils.js';

	interface Props {
		message: ChatMessage;
		onAllow?: () => void;
		onAllowAlways?: () => void;
		onDeny?: () => void;
	}

	let { message, onAllow, onAllowAlways, onDeny }: Props = $props();

	const toolName = $derived(message.toolName ?? 'Tool');
	const detail = $derived(extractToolDetail(message));
	const accentColor = $derived(getToolAccentColor(toolName));
</script>

<div
	class="overflow-hidden rounded-lg border bg-surface"
	style="border-color: color-mix(in oklch, var(--status-warning) 40%, var(--border))"
>
	<!-- Header -->
	<div
		class="flex h-9 items-center gap-2 border-b px-3"
		style="background: color-mix(in oklch, var(--status-warning) 8%, var(--surface-2)); border-color: color-mix(in oklch, var(--status-warning) 30%, var(--border))"
	>
		<AlertTriangleIcon size={13} strokeWidth={2} class="text-status-warning" />
		<span class="text-xs font-semibold">
			Agent wants to use <strong style="color: {accentColor}">{toolName}</strong>
		</span>
	</div>

	<!-- Content -->
	<div class="flex">
		<div class="w-0.75 shrink-0 bg-status-warning"></div>
		<div class="flex-1 px-3 py-2.5">
			{#if detail}
				<MonospaceBlock
					content={detail}
					class="m-0 mb-3 rounded-none border-0 bg-transparent p-0 text-foreground-muted"
				/>
			{/if}
			<div class="flex gap-1.5">
				<Button intent="primary" size="sm" class="h-(--size-control-md)" onclick={onAllow}>
					Allow <Kbd format="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
				</Button>
				<Button
					intent="secondary"
					size="sm"
					class="h-(--size-control-md)"
					onclick={onAllowAlways}
				>
					Allow Always
					<KbdGroup>
						<Kbd>Ctrl</Kbd>
						<Kbd format="lucide"><CornerDownLeftIcon /></Kbd>
					</KbdGroup>
				</Button>
				<Button intent="danger" size="sm" class="h-(--size-control-md)" onclick={onDeny}>
					Deny <Kbd>Esc</Kbd>
				</Button>
			</div>
		</div>
	</div>
</div>

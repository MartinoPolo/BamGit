<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	interface Props {
		username: string;
		initials: string;
		activeCount?: number;
		collapsed?: boolean;
	}

	let { username, initials, activeCount = 0, collapsed = false }: Props = $props();
</script>

{#if collapsed}
	<div class="flex justify-center">
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<div
						{...props}
						class="relative flex size-8 items-center justify-center rounded-full bg-[var(--moss-600)] text-[11px] font-semibold text-white"
					>
						{initials}
						{#if activeCount > 0}
							<span
								class="absolute -right-px -bottom-px size-2.5 rounded-full border-2 border-[var(--sidebar-bg)] bg-[var(--moss-400)]"
							></span>
						{/if}
					</div>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="right"
				>{m.user_tooltip({ username, count: String(activeCount) })}</Tooltip.Content
			>
		</Tooltip.Root>
	</div>
{:else}
	<button
		class="flex w-full items-center gap-2 rounded-lg p-2.5 transition-colors hover:bg-surface-2"
	>
		<div
			class="flex size-[26px] items-center justify-center rounded-full bg-[var(--moss-600)] text-[11px] font-semibold text-white"
		>
			{initials}
		</div>
		<div class="min-w-0 flex-1">
			<div class="text-xs font-medium">{username}</div>
			<div class="truncate text-[10px] text-foreground-subtle">
				{m.active_count({ count: String(activeCount) })}
			</div>
		</div>
		<ChevronUpIcon size={13} class="text-foreground-subtle" />
	</button>
{/if}

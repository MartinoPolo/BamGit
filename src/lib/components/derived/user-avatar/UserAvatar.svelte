<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
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
	<div class="flex w-full items-center justify-center py-3">
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<div
						{...props}
						class="relative flex size-6.5 items-center justify-center rounded-full bg-(--moss-600) text-[11px] font-semibold text-primary-foreground"
					>
						{initials}
						{#if activeCount > 0}
							<span
								class="absolute -right-px -bottom-px size-2.5 rounded-full border-2 border-sidebar bg-(--moss-400)"
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
	<div class="flex w-full items-center gap-2 py-2.5">
		<div class="flex w-10 shrink-0 items-center justify-center">
			<div
				class="flex size-6.5 items-center justify-center rounded-full bg-(--moss-600) text-[11px] font-semibold text-primary-foreground"
			>
				{initials}
			</div>
		</div>
		<div class="min-w-0 flex-1">
			<div class="text-xs font-medium">{username}</div>
			<div class="truncate text-[10px] text-foreground-subtle">
				{m.active_count({ count: String(activeCount) })}
			</div>
		</div>
	</div>
{/if}

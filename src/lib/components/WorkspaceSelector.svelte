<script lang="ts">
	import FolderIcon from '@lucide/svelte/icons/folder';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	interface Props {
		name: string;
		collapsed?: boolean;
	}

	let { name, collapsed = false }: Props = $props();
</script>

{#if collapsed}
	<div class="flex justify-center">
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						class="flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-surface-2"
					>
						<FolderIcon size={14} class="text-primary" />
					</button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="right">{name}</Tooltip.Content>
		</Tooltip.Root>
	</div>
{:else}
	<button
		class="flex w-full items-center gap-2 rounded-md bg-surface-2 px-2 py-1.5 text-left transition-colors hover:bg-surface-3"
	>
		<FolderIcon size={13} class="text-primary" />
		<span class="flex-1 truncate text-[12.5px] font-medium">{name}</span>
		<ChevronDownIcon size={12} class="text-foreground-subtle" />
	</button>
{/if}

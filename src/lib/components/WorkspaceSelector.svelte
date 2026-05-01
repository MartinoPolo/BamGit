<script lang="ts">
	import FolderIcon from '@lucide/svelte/icons/folder';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

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
					<Button {...props} variant="ghost" size="icon">
						<FolderIcon size={14} class="text-primary" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="right">{name}</Tooltip.Content>
		</Tooltip.Root>
	</div>
{:else}
	<Button variant="ghost" class="w-full justify-start gap-2 bg-surface-2 hover:bg-surface-3">
		<FolderIcon size={13} class="text-primary" />
		<span class="flex-1 truncate text-[12.5px] font-medium">{name}</span>
		<ChevronDownIcon size={12} class="text-foreground-subtle" />
	</Button>
{/if}

<script lang="ts">
	import FolderIcon from '@lucide/svelte/icons/folder';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import SidebarCollapsedItem from '$lib/components/derived/sidebar-collapsed-item/SidebarCollapsedItem.svelte';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';

	interface Props {
		name: string;
		collapsed?: boolean;
		onEdit?: () => void;
		onOpenSettings?: () => void;
	}

	let { name, collapsed = false, onEdit, onOpenSettings }: Props = $props();
</script>

{#if collapsed}
	<SidebarCollapsedItem
		icon={FolderIcon}
		label={name}
		onclick={onEdit}
		iconClass="text-primary"
	/>
{:else}
	<div class="flex items-center gap-1 rounded-lg bg-surface-2 px-3 py-1.5">
		<FolderIcon class="size-3.5 shrink-0 text-primary" />
		<span class="flex-1 truncate text-[12.5px] font-medium">{name}</span>
		<SimpleTooltip text="Edit workspace" side="top">
			<button
				type="button"
				class="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
				aria-label="Edit workspace"
				onclick={onEdit}
			>
				<PencilIcon class="size-3.5" />
			</button>
		</SimpleTooltip>
		<SimpleTooltip text="Workspace settings" side="top">
			<button
				type="button"
				class="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
				aria-label="Workspace settings"
				onclick={onOpenSettings}
			>
				<SettingsIcon class="size-3.5" />
			</button>
		</SimpleTooltip>
	</div>
{/if}

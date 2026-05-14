<script lang="ts">
	import FolderIcon from '@lucide/svelte/icons/folder';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import SidebarCollapsedItem from '$lib/components/derived/sidebar-collapsed-item/SidebarCollapsedItem.svelte';
	import { Button } from '$lib/components/shadcn/button/index.js';

	interface Props {
		name: string;
		collapsed?: boolean;
		onclick?: () => void;
	}

	let { name, collapsed = false, onclick }: Props = $props();
</script>

{#if collapsed}
	<SidebarCollapsedItem icon={FolderIcon} label={name} {onclick} iconClass="text-primary" />
{:else}
	<Button
		intent="ghost"
		class="w-full justify-start gap-2 bg-surface-2 hover:bg-surface-3"
		{onclick}
	>
		<FolderIcon class="text-primary" data-icon="inline-start" />
		<span class="flex-1 truncate text-[12.5px] font-medium">{name}</span>
		<PencilIcon class="text-foreground-subtle" data-icon="inline-end" />
	</Button>
{/if}

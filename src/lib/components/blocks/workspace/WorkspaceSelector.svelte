<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import type DropdownMenuPortal from '$lib/components/shadcn/dropdown-menu/dropdown-menu-portal.svelte';
	import type { ComponentProps } from 'svelte';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import HomeIcon from '@lucide/svelte/icons/home';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { useBoard } from '$lib/modules/board/board.context.svelte.js';
	import { useWindow } from '$lib/modules/window/window.context.svelte.js';

	interface Props {
		collapsed?: boolean;
		onEdit?: () => void;
		onOpenSettings?: () => void;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
	}

	let { collapsed = false, onEdit, onOpenSettings, portalProps }: Props = $props();

	const boardCtx = useBoard();
	const windowCtx = useWindow();

	const activeDashboards = $derived(boardCtx.dashboards.filter((d) => d.status === 'active'));

	const currentDashboardName = $derived(
		windowCtx.isOverview
			? m.nav_overview()
			: (activeDashboards.find((d) => d.id === windowCtx.boundDashboardId)?.name ??
					m.nav_workspace()),
	);
</script>

<DropdownMenu.Root>
	{#if collapsed}
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<SimpleTooltip text={m.nav_switch_workspace()} side="right">
					{#snippet asChild(tooltipProps)}
						<button
							{...props}
							{...tooltipProps}
							type="button"
							class="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-2 hover:bg-surface-hover hover:text-foreground"
							aria-label={m.nav_switch_workspace()}
						>
							<FolderIcon size={15} class="text-primary" />
						</button>
					{/snippet}
				</SimpleTooltip>
			{/snippet}
		</DropdownMenu.Trigger>
	{:else}
		<div class="flex items-center gap-0.5">
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors duration-2 hover:bg-surface-hover"
						aria-label={m.nav_switch_workspace()}
					>
						<FolderIcon class="size-3.5 shrink-0 text-primary" />
						<span class="flex-1 truncate text-left text-[12.5px] font-medium">
							{currentDashboardName}
						</span>
						<ChevronDownIcon class="size-3 shrink-0 text-muted-foreground" />
					</button>
				{/snippet}
			</DropdownMenu.Trigger>
			<SimpleTooltip text="Edit workspace" side="top">
				<button
					type="button"
					class="rounded-lg px-1.5 py-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
					aria-label="Edit workspace"
					onclick={onEdit}
				>
					<PencilIcon class="size-3.5" />
				</button>
			</SimpleTooltip>
			<SimpleTooltip text="Workspace settings" side="top">
				<button
					type="button"
					class="rounded-lg px-1.5 py-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
					aria-label="Workspace settings"
					onclick={onOpenSettings}
				>
					<SettingsIcon class="size-3.5" />
				</button>
			</SimpleTooltip>
		</div>
	{/if}
	<DropdownMenu.Content
		side={collapsed ? 'right' : 'bottom'}
		align="start"
		class="min-w-48 rounded-[var(--radius-lg)] border border-border bg-surface p-2 shadow-[var(--shadow-lg)]"
		{portalProps}
	>
		<DropdownMenu.Group>
			<DropdownMenu.Item
				class={cn(windowCtx.isOverview && 'bg-primary-soft')}
				onSelect={() => windowCtx.navigateToOverview()}
			>
				<HomeIcon />
				<span class="flex-1">{m.nav_overview()}</span>
				{#if windowCtx.isOverview}
					<CheckIcon class="size-3.5 text-primary" />
				{/if}
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator class="-mx-2 my-1.5" />
		<DropdownMenu.Group>
			{#each activeDashboards as dashboard (dashboard.id)}
				{@const isCurrent =
					!windowCtx.isOverview && dashboard.id === windowCtx.boundDashboardId}
				<DropdownMenu.Item
					class={cn(isCurrent && 'bg-primary-soft')}
					onSelect={() => windowCtx.navigateToWorkspace(dashboard.id)}
				>
					<FolderIcon />
					<span class="flex-1 truncate">{dashboard.name}</span>
					{#if isCurrent}
						<CheckIcon class="size-3.5 text-primary" />
					{/if}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
		{#if collapsed && !windowCtx.isOverview}
			<DropdownMenu.Separator class="-mx-2 my-1.5" />
			<DropdownMenu.Group>
				<DropdownMenu.Item onSelect={() => onEdit?.()}>
					<PencilIcon />
					Edit workspace
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={() => onOpenSettings?.()}>
					<SettingsIcon />
					Workspace settings
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>

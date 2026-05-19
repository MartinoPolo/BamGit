<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import TreesIcon from '@lucide/svelte/icons/trees';
	import CodeIcon from '@lucide/svelte/icons/code';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import BrandMark from '$lib/components/derived/brand-mark/BrandMark.svelte';
	import SidebarNavItem from '$lib/components/derived/sidebar-nav-item/SidebarNavItem.svelte';
	import WorkspaceSelector from '$lib/components/blocks/workspace/WorkspaceSelector.svelte';
	import UserAvatar from '$lib/components/derived/user-avatar/UserAvatar.svelte';
	import ThemeToggle from '$lib/components/derived/theme-toggle/ThemeToggle.svelte';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { useKeyboardShortcuts } from '$lib/modules/keyboard-shortcuts';

	interface Props {
		workspaceName: string;
		username: string;
		userInitials: string;
		activeSessionCount?: number;
		collapsed: boolean;
		onToggleSidebar: () => void;
		onEditWorkspace?: () => void;
		onOpenSettings?: () => void;
		onOpenWorkspaceSettings?: () => void;
	}

	let {
		workspaceName,
		username,
		userInitials,
		activeSessionCount = 0,
		collapsed,
		onToggleSidebar,
		onEditWorkspace,
		onOpenSettings,
		onOpenWorkspaceSettings,
	}: Props = $props();

	const NAV_LABELS = {
		dashboard: () => m.nav_dashboard(),
		sessions: () => m.nav_sessions(),
		usage: () => 'Usage',
		settings: () => m.nav_settings(),
	} as const;

	const shortcutsCtx = useKeyboardShortcuts();
	const toggleSidebarBinding = $derived(shortcutsCtx.getBindingForDisplay('toggle-sidebar'));

	const navigationItems = [
		{ href: resolve('/'), icon: TreesIcon, labelKey: 'dashboard' as const },
		{ href: resolve('/sessions'), icon: CodeIcon, labelKey: 'sessions' as const },
		{ href: resolve('/usage'), icon: BarChart3Icon, labelKey: 'usage' as const },
	];

	function isActive(itemHref: string): boolean {
		const pathname = page.url.pathname;
		if (itemHref === '/' || itemHref === resolve('/')) {
			return pathname === '/' || pathname === resolve('/');
		}
		return pathname === itemHref || pathname.startsWith(itemHref + '/');
	}
</script>

<aside
	class="h-full overflow-hidden border-r border-border bg-sidebar transition-[width] duration-4"
	style:width={collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)'}
>
	<div
		class="flex h-full shrink-0 flex-col"
		style:width={collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)'}
	>
		<!-- Brand row -->
		<div
			class="flex items-center px-2 py-3.5"
			class:justify-between={!collapsed}
			class:justify-center={collapsed}
		>
			{#if collapsed}
				<SimpleTooltip
					text={m.sidebar_expand({ shortcut: toggleSidebarBinding })}
					side="right"
				>
					{#snippet asChild(props)}
						<Button
							{...props}
							intent="ghost"
							size="icon-sm"
							onclick={onToggleSidebar}
							class="group relative hover:bg-surface-hover!"
							aria-label="Expand sidebar"
						>
							<span class="transition-opacity group-hover:opacity-0">
								<BrandMark size={22} />
							</span>
							<span
								class="absolute inset-0 flex items-center justify-center rounded-lg bg-surface-hover opacity-0 transition-opacity group-hover:opacity-100"
							>
								<ChevronRightIcon data-icon="inline-start" />
							</span>
						</Button>
					{/snippet}
				</SimpleTooltip>
			{:else}
				<div class="flex items-center">
					<div class="flex w-10 shrink-0 items-center justify-center">
						<BrandMark size={22} />
					</div>
					<span class="text-sm font-semibold tracking-tight">{m.app_name()}</span>
				</div>
				<SimpleTooltip
					text={m.sidebar_collapse({ shortcut: toggleSidebarBinding })}
					side="right"
				>
					<Button
						intent="ghost"
						size="icon-sm"
						onclick={onToggleSidebar}
						aria-label="Collapse sidebar"
					>
						<PanelLeftIcon data-icon="inline-start" />
					</Button>
				</SimpleTooltip>
			{/if}
		</div>

		<!-- Workspace selector -->
		<div
			class="mb-3 px-2"
			class:flex={collapsed}
			class:items-center={collapsed}
			class:justify-center={collapsed}
		>
			{#if !collapsed}
				<div
					class="mb-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle"
				>
					{m.nav_workspace()}
				</div>
			{/if}
			<WorkspaceSelector
				name={workspaceName}
				{collapsed}
				onEdit={onEditWorkspace}
				onOpenSettings={onOpenWorkspaceSettings}
			/>
		</div>

		<!-- Navigation -->
		<nav class="flex flex-col gap-1 px-2" class:items-center={collapsed}>
			{#if !collapsed}
				<div
					class="mb-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle"
				>
					{m.nav_navigate()}
				</div>
			{/if}
			{#each navigationItems as item (item.href)}
				<SidebarNavItem
					icon={item.icon}
					label={NAV_LABELS[item.labelKey]()}
					href={item.href}
					active={isActive(item.href)}
					{collapsed}
				/>
			{/each}
		</nav>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- User section -->
		<div
			class="border-t border-border p-2"
			class:flex={collapsed}
			class:flex-col={collapsed}
			class:items-center={collapsed}
			class:gap-1={collapsed}
		>
			{#if collapsed}
				<UserAvatar
					{username}
					initials={userInitials}
					activeCount={activeSessionCount}
					{collapsed}
				/>
				<ThemeToggle {collapsed} />
				<SidebarNavItem
					icon={SettingsIcon}
					label={NAV_LABELS.settings()}
					href={resolve('/settings/general')}
					active={isActive(resolve('/settings'))}
					{collapsed}
					onclick={(event) => {
						if (onOpenSettings) {
							event.preventDefault();
							onOpenSettings();
						}
					}}
				/>
			{:else}
				<div class="flex items-center justify-between">
					<UserAvatar
						{username}
						initials={userInitials}
						activeCount={activeSessionCount}
						{collapsed}
					/>
					<div class="flex items-center gap-0.5">
						<ThemeToggle compact />
						<SimpleTooltip text={NAV_LABELS.settings()} side="top">
							{#snippet asChild(props)}
								<button
									{...props}
									type="button"
									class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
									aria-label={NAV_LABELS.settings()}
									onclick={onOpenSettings}
								>
									<SettingsIcon size={14} />
								</button>
							{/snippet}
						</SimpleTooltip>
					</div>
				</div>
			{/if}
		</div>
	</div>
</aside>

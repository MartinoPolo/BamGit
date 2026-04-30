<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import TreesIcon from '@lucide/svelte/icons/trees';
	import CodeIcon from '@lucide/svelte/icons/code';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import BrandMark from './BrandMark.svelte';
	import SidebarNavItem from './SidebarNavItem.svelte';
	import WorkspaceSelector from './WorkspaceSelector.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	interface Props {
		workspaceName: string;
		username: string;
		userInitials: string;
		activeSessionCount?: number;
		collapsed: boolean;
		onToggleSidebar: () => void;
	}

	let {
		workspaceName,
		username,
		userInitials,
		activeSessionCount = 0,
		collapsed,
		onToggleSidebar,
	}: Props = $props();

	const NAV_LABELS = {
		dashboard: () => m.nav_dashboard(),
		sessions: () => m.nav_sessions(),
		settings: () => m.nav_settings(),
	} as const;

	const navigationItems = [
		{ href: resolve('/'), icon: TreesIcon, labelKey: 'dashboard' as const },
		{ href: resolve('/sessions'), icon: CodeIcon, labelKey: 'sessions' as const },
		{ href: resolve('/settings'), icon: SettingsIcon, labelKey: 'settings' as const },
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
	class="flex h-full flex-col border-r border-border bg-sidebar transition-all duration-200"
	style:width={collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)'}
>
	<!-- Brand row -->
	<div
		class="flex items-center px-3.5 py-3.5"
		class:justify-center={collapsed}
		class:justify-between={!collapsed}
	>
		{#if collapsed}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							onclick={onToggleSidebar}
							class="group relative flex size-9 items-center justify-center rounded-lg"
							aria-label="Expand sidebar"
						>
							<span class="transition-opacity group-hover:opacity-0">
								<BrandMark size={22} />
							</span>
							<span
								class="absolute inset-0 flex items-center justify-center rounded-lg bg-surface-2 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<ChevronRightIcon size={14} />
							</span>
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="right">{m.sidebar_expand()}</Tooltip.Content>
			</Tooltip.Root>
		{:else}
			<div class="flex items-center gap-2">
				<BrandMark size={22} />
				<span class="text-sm font-semibold tracking-tight">{m.app_name()}</span>
			</div>
			<button
				onclick={onToggleSidebar}
				class="flex size-[22px] items-center justify-center rounded-[5px] text-foreground-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
				aria-label="Collapse sidebar"
				title={m.sidebar_collapse()}
			>
				<PanelLeftIcon size={14} />
			</button>
		{/if}
	</div>

	<!-- Workspace selector -->
	<div class="mb-3 px-2">
		{#if !collapsed}
			<div
				class="mb-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle"
			>
				{m.nav_workspace()}
			</div>
		{/if}
		<WorkspaceSelector name={workspaceName} {collapsed} />
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

	<!-- Language switcher -->
	<div class="border-t border-border p-2">
		<LanguageSwitcher {collapsed} />
	</div>

	<!-- Theme toggle -->
	<div class="border-t border-border p-2">
		<ThemeToggle {collapsed} />
	</div>

	<!-- User section -->
	<div class="border-t border-border p-2">
		<UserAvatar
			{username}
			initials={userInitials}
			activeCount={activeSessionCount}
			{collapsed}
		/>
	</div>
</aside>

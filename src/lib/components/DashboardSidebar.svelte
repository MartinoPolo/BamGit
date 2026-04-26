<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Dashboard } from '$lib/types/generated';
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		dashboards: Dashboard[];
		activeDashboardId: string | null;
		collapsed: boolean;
		onSelectDashboard: (id: string) => void;
		onToggleSidebar: () => void;
		onCreateDashboard: () => void;
		onEditDashboard: (dashboard: Dashboard) => void;
	}

	let {
		dashboards,
		activeDashboardId,
		collapsed,
		onSelectDashboard,
		onToggleSidebar,
		onCreateDashboard,
		onEditDashboard,
	}: Props = $props();

	const navigationItems = [
		{ href: '/issues' as const, label: 'Issues', icon: '☰' },
		{ href: '/sessions' as const, label: 'Sessions', icon: '▶' },
		{ href: '/settings' as const, label: 'Settings', icon: '⚙' },
	];
</script>

<aside
	class="flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all {collapsed
		? 'w-12'
		: 'w-60'}"
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-sidebar-border px-3 py-2">
		{#if !collapsed}
			<span class="text-sm font-bold tracking-wide text-sidebar-foreground">Grovekeeper</span>
		{/if}
		<button
			onclick={onToggleSidebar}
			class="rounded p-1 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{collapsed ? '▸' : '◂'}
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex flex-col gap-0.5 border-b border-sidebar-border p-2">
		{#each navigationItems as item (item.href)}
			<a
				href={resolve(item.href)}
				class="flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors {page
					.url.pathname === item.href || page.url.pathname.startsWith(item.href + '/')
					? 'bg-sidebar-accent text-sidebar-accent-foreground'
					: 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'}"
				title={collapsed ? item.label : undefined}
			>
				<span class="text-xs">{item.icon}</span>
				{#if !collapsed}
					<span>{item.label}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Dashboard List -->
	{#if !collapsed}
		<div class="flex items-center justify-between px-3 pt-3 pb-1">
			<span class="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground"
				>Dashboards</span
			>
			<button
				onclick={onCreateDashboard}
				class="rounded p-0.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
				title="Create dashboard"
			>
				<span class="text-sm">+</span>
			</button>
		</div>

		<div class="flex-1 overflow-y-auto px-2 pb-2">
			{#each dashboards as dashboard (dashboard.id)}
				<button
					onclick={() => onSelectDashboard(dashboard.id)}
					ondblclick={() => onEditDashboard(dashboard)}
					class="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors {dashboard.id ===
					activeDashboardId
						? 'bg-sidebar-accent text-sidebar-accent-foreground'
						: 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'}"
				>
					<span class="text-xs text-sidebar-foreground" title={dashboard.type}>
						{dashboard.type === 'repo' ? '◆' : '◇'}
					</span>
					<span class="truncate">{dashboard.name}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Theme Toggle -->
	<div class="mt-auto border-t border-sidebar-border p-2">
		<ThemeToggle {collapsed} />
	</div>
</aside>

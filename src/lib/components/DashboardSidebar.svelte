<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Dashboard } from '$lib/types/dashboard';

	interface Props {
		dashboards: Dashboard[];
		active_dashboard_id: string | null;
		collapsed: boolean;
		on_select_dashboard: (id: string) => void;
		on_toggle_sidebar: () => void;
		on_create_dashboard: () => void;
		on_edit_dashboard: (dashboard: Dashboard) => void;
	}

	let {
		dashboards,
		active_dashboard_id,
		collapsed,
		on_select_dashboard,
		on_toggle_sidebar,
		on_create_dashboard,
		on_edit_dashboard,
	}: Props = $props();

	const navigation_items = [
		{ href: '/issues' as const, label: 'Issues', icon: '☰' },
		{ href: '/sessions' as const, label: 'Sessions', icon: '▶' },
		{ href: '/settings' as const, label: 'Settings', icon: '⚙' },
	];
</script>

<aside
	class="flex h-full flex-col border-r border-neutral-800 bg-neutral-950 transition-all {collapsed
		? 'w-12'
		: 'w-60'}"
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
		{#if !collapsed}
			<span class="text-sm font-bold tracking-wide text-neutral-400">BamGit</span>
		{/if}
		<button
			onclick={on_toggle_sidebar}
			class="rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{collapsed ? '▸' : '◂'}
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex flex-col gap-0.5 border-b border-neutral-800 p-2">
		{#each navigation_items as item (item.href)}
			<a
				href={resolve(item.href)}
				class="flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors {page
					.url.pathname === item.href || page.url.pathname.startsWith(item.href + '/')
					? 'bg-neutral-800 text-white'
					: 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}"
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
			<span class="text-xs font-semibold uppercase tracking-wider text-neutral-500"
				>Dashboards</span
			>
			<button
				onclick={on_create_dashboard}
				class="rounded p-0.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
				title="Create dashboard"
			>
				<span class="text-sm">+</span>
			</button>
		</div>

		<div class="flex-1 overflow-y-auto px-2 pb-2">
			{#each dashboards as dashboard (dashboard.id)}
				<button
					onclick={() => on_select_dashboard(dashboard.id)}
					ondblclick={() => on_edit_dashboard(dashboard)}
					class="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors {dashboard.id ===
					active_dashboard_id
						? 'bg-neutral-800 text-white'
						: 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}"
				>
					<span class="text-xs text-neutral-500" title={dashboard.type}>
						{dashboard.type === 'repo' ? '◆' : '◇'}
					</span>
					<span class="truncate">{dashboard.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</aside>

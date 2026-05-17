<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UserIcon from '@lucide/svelte/icons/user';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import BellIcon from '@lucide/svelte/icons/bell';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import KeyboardIcon from '@lucide/svelte/icons/keyboard';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import SidebarNavItem from '$lib/components/derived/sidebar-nav-item/SidebarNavItem.svelte';
	import * as ToggleGroup from '$lib/components/shadcn/toggle-group/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { useBoard } from '$lib/modules/board';
	import type { Component } from 'svelte';

	let { children } = $props();

	const boardStore = useBoard();

	const scope = $derived(page.url.searchParams.get('scope') === 'ws' ? 'workspace' : 'user');
	const scopeDashboardId = $derived(page.url.searchParams.get('id'));
	const hasWorkspace = $derived(boardStore.activeDashboard !== null);
	const workspaceName = $derived(boardStore.activeDashboard?.name ?? '');

	interface CategoryItem {
		key: string;
		path: string;
		icon: Component<{ size?: number; class?: string }>;
		label: string;
		userOnly: boolean;
		workspaceOnly: boolean;
	}

	const allCategories: CategoryItem[] = [
		{
			key: 'workspace',
			path: resolve('/settings/workspace'),
			icon: FolderIcon,
			label: 'Workspace',
			userOnly: false,
			workspaceOnly: true,
		},
		{
			key: 'general',
			path: resolve('/settings/general'),
			icon: SettingsIcon,
			label: 'General',
			userOnly: true,
			workspaceOnly: false,
		},
		{
			key: 'account',
			path: resolve('/settings/account'),
			icon: UserIcon,
			label: 'Account',
			userOnly: true,
			workspaceOnly: false,
		},
		{
			key: 'appearance',
			path: resolve('/settings/appearance'),
			icon: PaletteIcon,
			label: 'Appearance',
			userOnly: false,
			workspaceOnly: false,
		},
		{
			key: 'issue-cards',
			path: resolve('/settings/issue-cards'),
			icon: LayoutGridIcon,
			label: 'Issue Cards',
			userOnly: false,
			workspaceOnly: false,
		},
		{
			key: 'notifications',
			path: resolve('/settings/notifications'),
			icon: BellIcon,
			label: 'Notifications',
			userOnly: false,
			workspaceOnly: false,
		},
		{
			key: 'ai-config',
			path: resolve('/settings/ai-config'),
			icon: SparklesIcon,
			label: 'AI Configuration',
			userOnly: false,
			workspaceOnly: false,
		},
		{
			key: 'shortcuts',
			path: resolve('/settings/shortcuts'),
			icon: KeyboardIcon,
			label: 'Keyboard Shortcuts',
			userOnly: true,
			workspaceOnly: false,
		},
		{
			key: 'language',
			path: resolve('/settings/language'),
			icon: GlobeIcon,
			label: 'Language',
			userOnly: true,
			workspaceOnly: false,
		},
		{
			key: 'developer-tools',
			path: resolve('/settings/developer-tools'),
			icon: WrenchIcon,
			label: 'Developer Tools',
			userOnly: true,
			workspaceOnly: false,
		},
	];

	const visibleCategories = $derived(
		allCategories.filter((cat) => {
			if (scope === 'workspace') {
				return !cat.userOnly;
			}
			return !cat.workspaceOnly;
		}),
	);

	function categoryHref(path: string): string {
		if (scope === 'workspace' && scopeDashboardId !== null) {
			return `${path}?scope=ws&id=${scopeDashboardId}`;
		}
		return path;
	}

	function isActive(path: string): boolean {
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
	}

	function handleBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			void goto(resolve('/'));
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			handleBack();
		}
	}

	function handleScopeChange(value: string | undefined) {
		if (value === undefined) {
			return;
		}
		const currentRoute = page.url.pathname;
		if (value === 'workspace' && boardStore.activeDashboard !== null) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamically constructed query params
			void goto(`${currentRoute}?scope=ws&id=${boardStore.activeDashboard.id}`);
		} else {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- navigating to current route without query params
			void goto(currentRoute);
		}
	}

	const backLabel = $derived(
		scope === 'workspace' && workspaceName.length > 0
			? `Back to ${workspaceName}`
			: 'Back to app',
	);
</script>

<svelte:window onkeydown={handleEscape} />

<div class="grid h-screen overflow-hidden" style:grid-template-columns="240px 1fr">
	<aside class="flex h-full flex-col overflow-y-auto border-r border-border bg-sidebar">
		<div class="p-3">
			<Button intent="ghost" size="sm" class="w-full justify-start" onclick={handleBack}>
				<ArrowLeftIcon data-icon="inline-start" />
				{backLabel}
			</Button>
		</div>

		{#if hasWorkspace}
			<div class="px-3 pb-3">
				<ToggleGroup.Root
					type="single"
					value={scope}
					onValueChange={handleScopeChange}
					class="w-full"
				>
					<ToggleGroup.Item value="user" class="flex-1 text-xs">User</ToggleGroup.Item>
					<ToggleGroup.Item value="workspace" class="flex-1 text-xs"
						>Workspace</ToggleGroup.Item
					>
				</ToggleGroup.Root>
			</div>
		{/if}

		{#if scope === 'workspace' && workspaceName}
			<div
				class="mx-3 mb-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary"
			>
				{workspaceName}
			</div>
		{/if}

		<nav class="flex flex-col gap-0.5 px-2">
			{#each visibleCategories as category (category.key)}
				<SidebarNavItem
					icon={category.icon}
					label={category.label}
					href={categoryHref(category.path)}
					active={isActive(category.path)}
				/>
			{/each}
		</nav>

		<div class="flex-1"></div>
	</aside>

	<main class="flex-1 overflow-auto">
		<div class="mx-auto max-w-3xl p-8">
			{@render children()}
		</div>
	</main>
</div>

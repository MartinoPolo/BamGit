<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SidebarNavItem from '$lib/components/derived/sidebar-nav-item/SidebarNavItem.svelte';
	import * as ToggleGroup from '$lib/components/shadcn/toggle-group/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { useBoard } from '$lib/modules/board';
	import { useSettings } from '$lib/modules/settings';
	import { SETTINGS_CATEGORIES } from '$lib/modules/settings/settings_categories.js';
	import { cn } from '$lib/utils.js';

	let { children } = $props();

	const boardStore = useBoard();
	const settingsCtx = useSettings();

	const scope = $derived(page.url.searchParams.get('scope') === 'ws' ? 'workspace' : 'user');
	const scopeDashboardId = $derived(page.url.searchParams.get('id'));
	const hasWorkspace = $derived(scopeDashboardId !== null);
	const scopeDashboard = $derived(
		scopeDashboardId !== null
			? (boardStore.dashboards.find((d) => d.id === scopeDashboardId) ?? null)
			: null,
	);
	const workspaceName = $derived(scopeDashboard?.name ?? '');

	const effectiveDashboardId = $derived(scopeDashboardId ?? boardStore.activeDashboardId);
	const scopedDashboardId = $derived(scope === 'workspace' ? effectiveDashboardId : null);

	let lastLoadedScope = '';
	let lastLoadedId = '';
	$effect(() => {
		settingsCtx.setScope(scope, scopedDashboardId);
		const newId = scopedDashboardId ?? '';
		if (scope === lastLoadedScope && newId === lastLoadedId) {
			return;
		}
		lastLoadedScope = scope;
		lastLoadedId = newId;
		void settingsCtx.loadSettings(scopedDashboardId);
	});

	const visibleCategories = $derived(
		SETTINGS_CATEGORIES.filter((cat) => {
			if (cat.devOnly === true && !import.meta.env.DEV) {
				return false;
			}
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
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- navigating to stored URL from settings context
		void goto(settingsCtx.returnUrl);
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
		if (value === 'workspace' && scopeDashboardId !== null) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamically constructed query params
			void goto(`${currentRoute}?scope=ws&id=${scopeDashboardId}`, {
				replaceState: true,
			});
		} else {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- navigating to current route without query params
			void goto(currentRoute, { replaceState: true });
		}
	}

	const isFullWidthCategory = $derived(
		visibleCategories.find((cat) => isActive(cat.path))?.fullWidth ?? false,
	);

	const backLabel = $derived(
		scope === 'workspace' && workspaceName.length > 0
			? `Back to ${workspaceName}`
			: 'Back to app',
	);

	const workspaceAccentColor = $derived(scopeDashboard?.accent_color ?? null);
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
						>Workspace{workspaceName ? `: ${workspaceName}` : ''}</ToggleGroup.Item
					>
				</ToggleGroup.Root>
			</div>
		{/if}

		<nav class="flex flex-col gap-0.5 px-2">
			{#each visibleCategories as category (category.key)}
				<SidebarNavItem
					icon={category.icon}
					label={category.label}
					href={categoryHref(category.path)}
					active={isActive(category.path)}
					onclick={(event) => {
						event.preventDefault();
						const target = category.children
							? categoryHref(category.children[0].path)
							: categoryHref(category.path);
						// eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamically constructed route from categoryHref
						void goto(target, { replaceState: true });
					}}
				/>
				{#if category.children && isActive(category.path)}
					{#each category.children as child (child.key)}
						<SidebarNavItem
							icon={category.icon}
							label={child.label}
							href={categoryHref(child.path)}
							active={isActive(child.path)}
							nested
							onclick={(event) => {
								event.preventDefault();
								// eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamically constructed route from categoryHref
								void goto(categoryHref(child.path), { replaceState: true });
							}}
						/>
					{/each}
				{/if}
			{/each}
		</nav>

		<div class="flex-1"></div>
	</aside>

	<main class={cn('flex-1', isFullWidthCategory ? 'overflow-hidden' : 'overflow-auto')}>
		{#if scope === 'workspace' && workspaceName}
			<div
				class="border-b px-8 py-2 text-xs font-medium"
				style:border-color={workspaceAccentColor ?? 'var(--primary)'}
				style:background-color="{workspaceAccentColor ?? 'var(--primary)'}10"
				style:color={workspaceAccentColor ?? 'var(--primary)'}
			>
				{workspaceName}
			</div>
		{/if}
		{#if isFullWidthCategory}
			{@render children()}
		{:else}
			<div class="mx-auto max-w-3xl p-8">
				{@render children()}
			</div>
		{/if}
	</main>
</div>

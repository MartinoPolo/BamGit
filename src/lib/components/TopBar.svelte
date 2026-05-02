<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Snippet } from 'svelte';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import BellIcon from '@lucide/svelte/icons/bell';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TreesIcon from '@lucide/svelte/icons/trees';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		title: string;
		subtitle?: string;
		hasNotifications?: boolean;
		syncing?: boolean;
		forestCollapsed?: boolean;
		onSync?: () => void;
		onPlant?: () => void;
		onToggleForest?: () => void;
		children?: Snippet;
	}

	let {
		title,
		subtitle,
		hasNotifications = false,
		syncing = false,
		forestCollapsed = false,
		onSync,
		onPlant,
		onToggleForest,
		children,
	}: Props = $props();
</script>

<div class="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
	<!-- Left: title -->
	<div class="min-w-0">
		<h1 class="truncate text-[17px] font-semibold leading-tight">{title}</h1>
		{#if subtitle}
			<div class="mt-0.5 font-mono text-[10px] text-foreground-subtle">{subtitle}</div>
		{/if}
	</div>

	<!-- Right: controls -->
	<div class="flex shrink-0 items-center gap-1.5">
		{#if onSync}
			<Button
				variant="ghost"
				size="icon-sm"
				title={m.topbar_sync()}
				disabled={syncing}
				onclick={onSync}
			>
				<RefreshCwIcon size={13} class={syncing ? 'animate-spin' : ''} />
			</Button>
		{/if}

		<Button variant="ghost" size="icon-sm" class="relative" title={m.topbar_notifications()}>
			<BellIcon size={13} />
			{#if hasNotifications}
				<span class="absolute top-1 right-1 size-1.5 rounded-full bg-accent"></span>
			{/if}
		</Button>

		{#if onToggleForest}
			<Button
				variant={forestCollapsed ? 'ghost' : 'secondary'}
				size="icon-sm"
				title={forestCollapsed ? 'Show forest' : 'Hide forest'}
				onclick={onToggleForest}
			>
				<TreesIcon size={13} />
			</Button>
		{/if}

		{#if onPlant}
			<Button variant="primary" size="sm" title={m.topbar_plant_title()} onclick={onPlant}>
				<PlusIcon size={12} />
				<span>{m.topbar_plant()}</span>
			</Button>
		{/if}

		{#if children}
			{@render children()}
		{/if}
	</div>
</div>

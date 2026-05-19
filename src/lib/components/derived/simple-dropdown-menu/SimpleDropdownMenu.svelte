<script lang="ts">
	import type { Component, ComponentProps, Snippet } from 'svelte';
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';
	import type { WithoutChildrenOrChild } from '$lib/utils.js';
	import type DropdownMenuPortal from '$lib/components/shadcn/dropdown-menu/dropdown-menu-portal.svelte';

	// ─── Types ───────────────────────────────────────────────────────────────

	interface SimpleDropdownMenuItem {
		label: string;
		icon?: Component;
		onSelect: () => void;
		disabled?: boolean;
		destructive?: boolean;
	}

	interface Props {
		items: SimpleDropdownMenuItem[];
		trigger: Snippet;
		side?: 'top' | 'bottom' | 'left' | 'right';
		align?: 'start' | 'center' | 'end';
		class?: string;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
	}

	// ─── Props ───────────────────────────────────────────────────────────────

	let {
		items,
		trigger,
		side = 'bottom',
		align = 'end',
		class: className,
		portalProps,
	}: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{@render trigger()}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content {side} {align} class={className} {portalProps}>
		<DropdownMenu.Group>
			{#each items as item (item.label)}
				<DropdownMenu.Item
					onSelect={item.onSelect}
					disabled={item.disabled}
					variant={item.destructive === true ? 'destructive' : 'default'}
				>
					{#if item.icon}
						{@const IconComponent = item.icon}
						<IconComponent />
					{/if}
					{item.label}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

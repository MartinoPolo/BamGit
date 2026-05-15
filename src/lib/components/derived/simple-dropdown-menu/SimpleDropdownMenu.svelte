<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';

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
	}

	// ─── Props ───────────────────────────────────────────────────────────────

	let { items, trigger, side = 'bottom', align = 'end', class: className }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{@render trigger()}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content {side} {align} class={className}>
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

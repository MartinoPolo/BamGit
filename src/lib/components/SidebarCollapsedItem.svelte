<script lang="ts">
	import type { Component } from 'svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';
	import { sidebarCollapsedItemVariants } from './sidebar_collapsed_item_variants.js';

	interface Props {
		icon: Component<{ size?: number; class?: string }>;
		label: string;
		href?: string;
		onclick?: () => void;
		active?: boolean;
		disabled?: boolean;
		badge?: number | null;
		iconClass?: string;
	}

	let {
		icon: Icon,
		label,
		href,
		onclick,
		active = false,
		disabled = false,
		badge = null,
		iconClass,
	}: Props = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			{#if href}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- href is pre-resolved by parent -->
				<a
					{...props}
					{href}
					class={cn(sidebarCollapsedItemVariants({ active }))}
					aria-disabled={disabled || undefined}
					aria-current={active ? 'page' : undefined}
				>
					<Icon size={15} class={iconClass ?? (active ? 'text-primary' : '')} />
					{#if badge !== null}
						<span class="absolute right-1.25 top-1.25 size-1.5 rounded-full bg-primary"
						></span>
					{/if}
				</a>
			{:else}
				<button
					{...props}
					type="button"
					class={cn(sidebarCollapsedItemVariants({ active }))}
					{disabled}
					{onclick}
				>
					<Icon size={15} class={iconClass ?? (active ? 'text-primary' : '')} />
					{#if badge !== null}
						<span class="absolute right-1.25 top-1.25 size-1.5 rounded-full bg-primary"
						></span>
					{/if}
				</button>
			{/if}
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Content side="right">{label}</Tooltip.Content>
</Tooltip.Root>

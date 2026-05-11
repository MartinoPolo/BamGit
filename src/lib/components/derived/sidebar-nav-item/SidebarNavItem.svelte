<script lang="ts">
	import type { Component } from 'svelte';
	import SidebarCollapsedItem from '$lib/components/derived/sidebar-collapsed-item/SidebarCollapsedItem.svelte';

	interface Props {
		icon: Component<{ size?: number; class?: string }>;
		label: string;
		href: string;
		active?: boolean;
		disabled?: boolean;
		collapsed?: boolean;
		badge?: number | null;
		nested?: boolean;
	}

	let {
		icon: Icon,
		label,
		href,
		active = false,
		disabled = false,
		collapsed = false,
		badge = null,
		nested = false,
	}: Props = $props();
</script>

{#if collapsed}
	<SidebarCollapsedItem icon={Icon} {label} {href} {active} {disabled} {badge} />
{:else}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- href is pre-resolved by parent -->
	<a
		{href}
		class="sb-item"
		class:is-active={active}
		class:is-nested={nested}
		aria-disabled={disabled || undefined}
		aria-current={active ? 'page' : undefined}
	>
		<Icon size={14} class={active ? 'text-primary' : ''} />
		<span class="sb-item-label">{label}</span>
		{#if badge !== null}
			<span class="sb-badge">{badge}</span>
		{/if}
	</a>
{/if}

<style>
	.sb-item {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		height: var(--size-control-md);
		padding: 7px 10px 7px 13px;
		border-radius: var(--radius-md);
		font-size: 12.5px;
		color: var(--sidebar-fg);
		text-decoration: none;
		cursor: pointer;
		transition:
			background 120ms,
			color 120ms;
	}

	.sb-item.is-nested {
		padding-left: 28px;
	}

	.sb-item:hover {
		background: var(--surface-hover);
	}

	.sb-item.is-active {
		background: var(--primary-soft);
		color: var(--foreground);
		font-weight: 500;
	}

	.sb-item.is-active:hover {
		background: color-mix(in oklch, var(--primary-soft) 60%, var(--surface-2));
	}

	.sb-item:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	.sb-item[aria-disabled] {
		opacity: 0.4;
		pointer-events: none;
	}

	.sb-item-label {
		flex: 1;
	}

	.sb-badge {
		height: 16px;
		padding: 0 5px;
		font-size: 10px;
		font-weight: 600;
		line-height: 16px;
		border-radius: 999px;
		background: var(--primary-soft);
		color: var(--primary);
	}
</style>

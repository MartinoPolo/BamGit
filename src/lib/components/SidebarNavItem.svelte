<script lang="ts">
	import type { Component } from 'svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

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

<!-- eslint-disable svelte/no-navigation-without-resolve -- href is pre-resolved by parent -->
{#if collapsed}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<a
					{...props}
					{href}
					class="sb-item-collapsed"
					class:is-active={active}
					aria-disabled={disabled || undefined}
					aria-current={active ? 'page' : undefined}
				>
					<Icon size={15} class={active ? 'text-primary' : ''} />
					{#if badge !== null}
						<span class="sb-badge-dot"></span>
					{/if}
				</a>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="right">{label}</Tooltip.Content>
	</Tooltip.Root>
{:else}
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
		gap: 9px;
		padding: 7px 10px;
		border-radius: 7px;
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

	.sb-item-collapsed {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		color: var(--sidebar-fg);
		text-decoration: none;
		cursor: pointer;
		position: relative;
		transition:
			background 120ms,
			color 120ms;
	}

	.sb-item-collapsed:hover {
		background: var(--surface-hover);
	}

	.sb-item-collapsed.is-active {
		background: var(--primary-soft);
		color: var(--primary);
	}

	.sb-item-collapsed:focus-visible {
		outline: 2px solid var(--ring);
	}

	.sb-item-collapsed[aria-disabled] {
		opacity: 0.4;
		pointer-events: none;
	}

	.sb-badge-dot {
		position: absolute;
		top: 5px;
		right: 5px;
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: var(--primary);
	}
</style>

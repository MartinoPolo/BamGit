<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { cn } from '$lib/utils.js';
	import { getCostMagnitude, type CostMagnitude } from './cost_link_utils.js';
	import { formatCostWithFallback } from '$lib/modules/usage/currency.js';
	import type { MetricsPeriod, UsageScope } from '$lib/modules/usage/usage_types.js';
	import { serializeUsageToParams } from '$lib/modules/usage/url_state.js';

	interface Props {
		costUsd: number;
		period?: MetricsPeriod;
		scope?: UsageScope;
		size?: 'sm' | 'md';
		disabled?: boolean;
		currency?: string;
		exchangeRate?: number | null;
		class?: string;
	}

	let {
		costUsd = 0,
		period = 'today',
		scope = 'workspace',
		size = 'md',
		disabled = false,
		currency,
		exchangeRate,
		class: className,
	}: Props = $props();

	const magnitude: CostMagnitude = $derived(getCostMagnitude(costUsd));
	const displayValue: string = $derived(
		formatCostWithFallback(costUsd, currency ?? 'USD', exchangeRate ?? null),
	);

	const usageHref: string = $derived.by(() => {
		const params = serializeUsageToParams({
			period,
			scope,
			groupBy: null,
			customFrom: null,
			customTo: null,
		});
		const search = params.toString();
		return resolve('/usage') + (search ? `?${search}` : '');
	});

	function navigateToUsage() {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- usageHref already resolved via resolve('/usage')
		void goto(usageHref);
	}

	function handleClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (!disabled) {
			navigateToUsage();
		}
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- usageHref already resolved via resolve('/usage') -->
<SimpleTooltip text="View usage details" side="top">
	<a
		href={usageHref}
		class={cn('cost-link', `cost-link-${size}`, `cost-link-${magnitude}`, className)}
		aria-label="View usage for {displayValue}, {period} period"
		aria-disabled={disabled}
		tabindex={disabled ? -1 : 0}
		onclick={handleClick}
	>
		{displayValue}
	</a>
</SimpleTooltip>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	.cost-link {
		display: inline;
		text-decoration: none;
		cursor: pointer;
		border: none;
		background: none;
		padding: 0;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-variant-numeric: tabular-nums;
		font-weight: 500;
		outline: none;
		position: relative;
		transition:
			color var(--transition-duration-3) ease-out,
			text-shadow var(--transition-duration-4) ease-out,
			filter var(--transition-duration-3) ease-out;
		user-select: none;
		border-bottom: 1px solid transparent;
	}

	.cost-link-sm {
		font-size: 10.5px;
		letter-spacing: 0.01em;
		line-height: 1.4;
	}

	.cost-link-md {
		font-size: var(--text-sm, 0.875rem);
		letter-spacing: 0.01em;
		line-height: 1.4;
	}

	/* Magnitude: LOW (< $1) */
	.cost-link-low {
		--cl-color: oklch(0.7 0.12 142);
		--cl-color-hover: oklch(0.78 0.135 138);
		--cl-glow: oklch(0.58 0.096 134 / 35%);
		--cl-underline: oklch(0.58 0.096 134 / 50%);
		--cl-ring: oklch(0.58 0.096 134);
	}

	/* Magnitude: MEDIUM ($1-$20) */
	.cost-link-medium {
		--cl-color: oklch(0.79 0.145 68);
		--cl-color-hover: oklch(0.84 0.16 65);
		--cl-glow: oklch(0.69 0.165 55 / 30%);
		--cl-underline: oklch(0.69 0.165 55 / 50%);
		--cl-ring: oklch(0.69 0.165 55);
	}

	/* Magnitude: HIGH (> $20) */
	.cost-link-high {
		--cl-color: oklch(0.72 0.135 15);
		--cl-color-hover: oklch(0.78 0.155 14);
		--cl-glow: oklch(0.62 0.205 25 / 30%);
		--cl-underline: oklch(0.62 0.155 25 / 50%);
		--cl-ring: oklch(0.64 0.155 15);
	}

	.cost-link-low,
	.cost-link-medium,
	.cost-link-high {
		color: var(--cl-color);
	}

	.cost-link:hover {
		color: var(--cl-color-hover);
		text-shadow: 0 0 12px var(--cl-glow);
		border-bottom-color: var(--cl-underline);
	}

	.cost-link:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--background, #000),
			0 0 0 4px var(--cl-ring);
		border-radius: 2px;
	}

	.cost-link:active {
		filter: brightness(0.85);
	}

	.cost-link[aria-disabled='true'] {
		color: var(--foreground-subtle, #666) !important;
		opacity: 0.42;
		cursor: not-allowed;
		pointer-events: none;
		text-shadow: none !important;
		border-bottom-color: transparent !important;
	}
</style>

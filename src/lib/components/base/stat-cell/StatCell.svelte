<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { statCellVariants, type StatCellProps } from './stat-cell-variants.js';

	let {
		label,
		value,
		suffix,
		tone = 'neutral',
		icon: IconComponent,
		pulse = false,
		onclick,
		class: className,
	}: StatCellProps = $props();

	const effectiveTone = $derived.by(() => {
		if (tone !== 'neutral') {
			return tone;
		}
		if (value === 0 || value === '0') {
			return 'zero' as const;
		}
		return 'neutral' as const;
	});

	const showPulse = $derived.by(() => {
		if (!pulse) {
			return false;
		}
		if (typeof value === 'number') {
			return value > 0;
		}
		return value !== '0' && value !== '';
	});

	const labelColorClass = $derived.by(() => {
		if (effectiveTone === 'warning') {
			return 'text-[color-mix(in_oklch,var(--status-warning)_80%,var(--foreground))]';
		}
		if (effectiveTone === 'danger') {
			return 'text-[color-mix(in_oklch,var(--status-danger)_75%,var(--foreground))]';
		}
		return 'text-foreground-subtle';
	});

	const valueColorClass = $derived.by(() => {
		if (effectiveTone === 'warning') {
			return 'text-status-warning';
		}
		if (effectiveTone === 'danger') {
			return 'text-status-danger';
		}
		if (effectiveTone === 'zero') {
			return 'text-foreground-subtle';
		}
		return 'text-foreground';
	});

	const valueWeightClass = $derived(effectiveTone === 'zero' ? 'font-medium' : 'font-semibold');
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class={cn(statCellVariants({ tone: effectiveTone }), onclick && 'cursor-pointer', className)}
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
	onclick={onclick
		? (event: MouseEvent) => {
				event.stopPropagation();
				onclick();
			}
		: undefined}
	onkeydown={onclick
		? (event: KeyboardEvent) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					event.stopPropagation();
					onclick();
				}
			}
		: undefined}
>
	<span
		class={cn(
			'flex items-center gap-1 font-mono text-[9.5px] uppercase leading-none tracking-[0.04em]',
			labelColorClass,
		)}
	>
		{#if IconComponent}
			<IconComponent class="size-3 shrink-0" />
		{/if}
		{label}
	</span>
	<span class="flex items-center gap-1.5">
		<span class="flex items-baseline">
			<span
				class={cn(
					'font-mono text-[16px] leading-none tabular-nums',
					valueWeightClass,
					valueColorClass,
				)}
			>
				{value}
			</span>
			{#if suffix}
				<span
					class="font-mono text-[11px] leading-none tabular-nums text-foreground-muted font-medium"
				>
					{suffix}
				</span>
			{/if}
		</span>
		{#if showPulse}
			<span
				class={cn(
					'size-1.5 shrink-0 rounded-full bg-current animate-ws-pulse-ring',
					effectiveTone === 'warning' || effectiveTone === 'danger'
						? valueColorClass
						: 'text-foreground',
				)}
			></span>
		{/if}
	</span>
</div>

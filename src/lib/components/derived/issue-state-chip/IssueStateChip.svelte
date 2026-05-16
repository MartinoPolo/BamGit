<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { IssueStateChipProps } from './issue_state_chip_types.js';

	let { label, colorVariable, badgeStyle = 'borderless-dark' }: IssueStateChipProps = $props();

	let chipColorValue = $derived(`var(${colorVariable})`);

	let chipClasses = $derived.by(() => {
		const base =
			'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider leading-none px-1.5 py-1 rounded-sm';

		if (badgeStyle === 'solid') {
			return cn(base, 'bg-[var(--chip-color)] text-white border border-transparent');
		}
		if (badgeStyle === 'bordered-dark') {
			return cn(
				base,
				'bg-[color-mix(in_oklch,var(--chip-color)_14%,transparent)] text-[var(--chip-color)] border border-[color-mix(in_oklch,var(--chip-color)_25%,transparent)]',
			);
		}
		return cn(
			base,
			'bg-[color-mix(in_oklch,var(--chip-color)_14%,transparent)] text-[var(--chip-color)] border border-transparent',
		);
	});
</script>

<span class={chipClasses} style:--chip-color={chipColorValue} role="status" aria-label={label}>
	<span class="size-1.5 shrink-0 rounded-full bg-[var(--chip-color)]"></span>
	{label}
</span>

<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { resolveBadgeStyleClass } from '$lib/components/shadcn/badge/badge_style_utils.js';
	import type { IssueStateChipProps } from './issue_state_chip_types.js';

	let { label, colorVariable, badgeStyle = 'subtle' }: IssueStateChipProps = $props();

	let chipColorValue = $derived(`var(${colorVariable})`);

	let chipClasses = $derived.by(() => {
		const base =
			'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider leading-none px-1.5 py-1 rounded-sm';

		return cn(base, resolveBadgeStyleClass(badgeStyle));
	});
</script>

<span class={chipClasses} style:--badge-color={chipColorValue} role="status" aria-label={label}>
	<span class="size-1.5 shrink-0 rounded-full" style:background={chipColorValue}></span>
	{label}
</span>

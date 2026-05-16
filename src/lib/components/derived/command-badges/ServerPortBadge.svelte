<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { openUrl } from '$lib/opener.js';
	import type { ServerPortBadgeProps } from './server_port_badge_types.js';

	let { port, badgeStyle = 'borderless-dark', onclick }: ServerPortBadgeProps = $props();

	function handleClick() {
		if (onclick !== undefined) {
			onclick();
		} else {
			void openUrl(`http://localhost:${port}`);
		}
	}

	let badgeClasses = $derived.by(() => {
		const base =
			'inline-flex items-center gap-1.5 font-mono text-[10px] leading-none px-1.5 py-1 rounded-sm cursor-pointer hover:brightness-125 select-none';

		if (badgeStyle === 'solid') {
			return cn(base, 'bg-status-success text-white border border-transparent');
		}
		if (badgeStyle === 'bordered-dark') {
			return cn(
				base,
				'bg-[color-mix(in_oklch,var(--status-success)_14%,transparent)] text-status-success border border-[color-mix(in_oklch,var(--status-success)_25%,transparent)]',
			);
		}
		return cn(
			base,
			'bg-[color-mix(in_oklch,var(--status-success)_14%,transparent)] text-status-success border border-transparent',
		);
	});
</script>

<button type="button" class={badgeClasses} onclick={handleClick} aria-label="Open port {port}">
	<span class="size-1.5 shrink-0 rounded-full bg-status-success"></span>
	{port}
</button>

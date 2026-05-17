<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { openUrl } from '$lib/opener.js';
	import { resolveBadgeStyleClass } from '$lib/components/shadcn/badge/badge_style_utils.js';
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

		return cn(base, resolveBadgeStyleClass(badgeStyle));
	});
</script>

<button
	type="button"
	class={badgeClasses}
	style:--badge-color="var(--status-success)"
	onclick={handleClick}
	aria-label="Open port {port}"
>
	<span class="size-1.5 shrink-0 rounded-full bg-status-success"></span>
	{port}
</button>

<script lang="ts">
	import { openUrl } from '$lib/opener.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import type { ServerPortBadgeProps } from './server_port_badge_types.js';

	let { port, badgeStyle = 'borderless-dark', onclick }: ServerPortBadgeProps = $props();

	function handleClick() {
		if (onclick !== undefined) {
			onclick();
		} else {
			void openUrl(`http://localhost:${port}`);
		}
	}
</script>

<button
	type="button"
	class="cursor-pointer select-none hover:brightness-125"
	onclick={handleClick}
	aria-label="Open port {port}"
>
	<Badge tone="success" {badgeStyle} format="mono" dot="static">
		:{port}
	</Badge>
</button>

<script lang="ts">
	import ZapIcon from '@lucide/svelte/icons/zap';
	import { getProviderConfig } from './session_theme_utils.js';

	interface Props {
		provider: string;
	}

	let { provider }: Props = $props();

	const config = $derived(getProviderConfig(provider));
</script>

<div
	class="inline-flex cursor-pointer items-center gap-1.25 rounded-1.5 border border-border bg-surface-2 px-2 py-0.75 pl-1.25 transition-[border-color] duration-120 hover:border-border-strong"
>
	<div
		class="flex size-3.5 items-center justify-center rounded-0.75"
		style="background: {config.color}"
	>
		<ZapIcon size={9} strokeWidth={2.4} class="text-background" />
	</div>
	<span class="text-[11px] font-medium text-foreground">{config.name}</span>
</div>

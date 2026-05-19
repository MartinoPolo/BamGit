<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import PlusIcon from '@lucide/svelte/icons/plus';

	interface Props {
		onclick: () => void;
	}

	let { onclick }: Props = $props();
</script>

<button class="block h-full w-full text-left" {onclick}>
	<div
		class="flex h-full min-h-49 cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-dashed border-border bg-surface transition-all duration-4 hover:-translate-y-0.5 hover:border-moss-400 hover:bg-[color-mix(in_oklch,var(--moss-400)_6%,var(--surface))] hover:text-moss-300"
	>
		<div class="flex flex-col items-center gap-2.5 text-foreground-muted">
			<div class="flex size-9 items-center justify-center rounded-full bg-surface-2">
				<PlusIcon class="size-5" />
			</div>
			<span class="text-[13px] font-medium">{m.workspace_add()}</span>
		</div>
	</div>
</button>

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
		class="relative flex h-full min-h-[198px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-[1.5px] border-dashed border-[color-mix(in_oklch,var(--moss-400)_28%,var(--border))] bg-[radial-gradient(230px_190px_at_0%_100%,color-mix(in_oklch,var(--moss-400)_14%,transparent),transparent_70%),color-mix(in_oklch,var(--surface)_72%,transparent)] text-foreground-muted transition-[transform,border-color,background,color] duration-4 hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--moss-400)_48%,var(--border))] hover:text-foreground"
	>
		<div class="flex flex-col items-center gap-2.5 text-foreground-muted">
			<div
				class="flex size-11 items-center justify-center rounded-lg border border-[color-mix(in_oklch,var(--moss-400)_35%,var(--border))] bg-[radial-gradient(44px_38px_at_20%_86%,color-mix(in_oklch,var(--moss-400)_26%,transparent),transparent_70%),var(--surface-2)]"
			>
				<PlusIcon class="size-5" />
			</div>
			<span class="text-[13px] font-medium">{m.workspace_add()}</span>
		</div>
	</div>
</button>

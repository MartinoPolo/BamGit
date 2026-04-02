<script lang="ts">
	import type { Action } from '$lib/types/action';

	interface Props {
		actions: Action[];
		on_execute: (action_id: string) => void;
	}

	let { actions, on_execute }: Props = $props();

	const ICON_MAP: Record<string, string> = {
		play: '\u25B6',
		eye: '\uD83D\uDC41',
		wrench: '\uD83D\uDD27',
	};

	function get_icon_display(icon: string | null): string {
		if (icon === null || icon === '') {
			return '\u25CF';
		}
		return ICON_MAP[icon] ?? icon;
	}
</script>

<div class="flex items-center gap-0.5">
	{#each actions as action (action.id)}
		<button
			onclick={(event) => {
				event.stopPropagation();
				on_execute(action.id);
			}}
			class="rounded px-1.5 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
			title={action.name}
		>
			<span class="text-[10px]">{get_icon_display(action.icon)}</span>
		</button>
	{/each}
</div>

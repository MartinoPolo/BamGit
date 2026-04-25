<script lang="ts">
	import type { Action } from '$lib/types/action';

	interface Props {
		actions: Action[];
		onExecute: (actionId: string) => void;
	}

	let { actions, onExecute }: Props = $props();

	const ICON_MAP: Record<string, string> = {
		play: '▶',
		eye: '👁',
		wrench: '🔧',
	};

	function getIconDisplay(icon: string | null): string {
		if (icon === null || icon === '') {
			return '●';
		}
		return ICON_MAP[icon] ?? icon;
	}
</script>

<div class="flex items-center gap-0.5">
	{#each actions as action (action.id)}
		<button
			onclick={(event) => {
				event.stopPropagation();
				onExecute(action.id);
			}}
			class="rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			title={action.name}
		>
			<span class="text-[10px]">{getIconDisplay(action.icon)}</span>
		</button>
	{/each}
</div>

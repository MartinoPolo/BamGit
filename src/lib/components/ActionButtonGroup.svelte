<script lang="ts">
	import type { Action } from '$lib/types/generated';
	import { Button } from '$lib/components/ui/button/index.js';
	import { SimpleTooltip } from '$lib/components/ui/tooltip/index.js';

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
		<SimpleTooltip text={action.name}>
			<Button
				variant="ghost"
				size="icon-sm"
				class="h-[22px] w-auto px-1.5"
				onclick={(event: MouseEvent) => {
					event.stopPropagation();
					onExecute(action.id);
				}}
			>
				<span class="text-[10px]">{getIconDisplay(action.icon)}</span>
			</Button>
		</SimpleTooltip>
	{/each}
</div>

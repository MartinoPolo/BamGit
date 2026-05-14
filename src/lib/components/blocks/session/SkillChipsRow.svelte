<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';

	interface SkillChip {
		label: string;
		command: string;
		visible?: boolean;
	}

	interface Props {
		onChipClick?: (command: string) => void;
	}

	let { onChipClick }: Props = $props();

	const defaultChips: SkillChip[] = [
		{ label: 'Execute', command: '/execute' },
		{ label: 'Review', command: '/review' },
		{ label: 'Check & Fix', command: '/check-and-fix' },
		{ label: 'Commit', command: '/commit' },
		{ label: 'Ship', command: '/ship' },
	];
</script>

<div class="flex flex-wrap items-center gap-1 px-3 pb-1 pt-2">
	{#each defaultChips as chip (chip.command)}
		<Button
			intent="secondary"
			size="sm"
			class="rounded-full px-2 text-[10.5px]"
			onclick={() => onChipClick?.(chip.command)}
		>
			{chip.label}
		</Button>
	{/each}
	<Button intent="ghost" size="sm" class="px-1.5 text-[10.5px]">More ▾</Button>
</div>

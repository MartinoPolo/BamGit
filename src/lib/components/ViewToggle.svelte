<script lang="ts">
	import { List, Trees } from 'lucide-svelte';
	import type { ViewMode } from '$lib/modules/board';

	interface Props {
		viewMode: ViewMode;
		onChange: (mode: ViewMode) => void;
	}

	let { viewMode, onChange }: Props = $props();

	const options = [
		{ value: 'cards' as const, Icon: List, label: 'Cards' },
		{ value: 'forest' as const, Icon: Trees, label: 'Forest' },
	];
</script>

<div
	role="group"
	aria-label="View mode"
	class="flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5"
>
	{#each options as { value, Icon, label } (value)}
		<button
			onclick={() => onChange(value)}
			class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors {viewMode ===
			value
				? 'bg-background text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}"
			title="{label} view"
			aria-pressed={viewMode === value}
		>
			<Icon size={13} />
			<span>{label}</span>
		</button>
	{/each}
</div>

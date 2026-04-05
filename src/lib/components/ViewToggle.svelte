<script lang="ts">
	import { List, Trees } from 'lucide-svelte';
	import type { ViewMode } from '$lib/stores/view_preference.svelte';

	interface Props {
		view_mode: ViewMode;
		on_change: (mode: ViewMode) => void;
	}

	let { view_mode, on_change }: Props = $props();

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
			onclick={() => on_change(value)}
			class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors {view_mode ===
			value
				? 'bg-background text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}"
			title="{label} view"
			aria-pressed={view_mode === value}
		>
			<Icon size={13} />
			<span>{label}</span>
		</button>
	{/each}
</div>

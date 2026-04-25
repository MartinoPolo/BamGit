<script lang="ts">
	import { useTheme } from '$lib/context/theme.context.svelte.js';
	import { Sun, Moon, Monitor } from 'lucide-svelte';

	interface Props {
		collapsed?: boolean;
	}

	let { collapsed = false }: Props = $props();

	const theme = useTheme();

	const modes = [
		{ value: 'light' as const, Icon: Sun, label: 'Light' },
		{ value: 'dark' as const, Icon: Moon, label: 'Dark' },
		{ value: 'system' as const, Icon: Monitor, label: 'System' },
	];

	function cycleMode() {
		const currentIndex = modes.findIndex((m) => m.value === theme.mode);
		theme.mode = modes[(currentIndex + 1) % modes.length].value;
	}

	const currentMode = $derived(modes.find((m) => m.value === theme.mode)!);
</script>

{#if collapsed}
	<button
		onclick={cycleMode}
		class="flex w-full items-center justify-center rounded p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
		aria-label="{currentMode.label} theme"
		title="{currentMode.label} mode"
	>
		<currentMode.Icon class="size-4" />
	</button>
{:else}
	<div class="flex items-center gap-1 rounded-md bg-secondary p-1">
		{#each modes as { value, Icon, label } (value)}
			<button
				onclick={() => (theme.mode = value)}
				class="flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs transition-colors {theme.mode ===
				value
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				title="{label} mode"
			>
				<Icon class="size-3.5" />
				<span>{label}</span>
			</button>
		{/each}
	</div>
{/if}

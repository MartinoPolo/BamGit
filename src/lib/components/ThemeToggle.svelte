<script lang="ts">
	import { get_theme_store } from '$lib/stores/theme.svelte';
	import { Sun, Moon, Monitor } from 'lucide-svelte';

	interface Props {
		collapsed?: boolean;
	}

	let { collapsed = false }: Props = $props();

	const theme = get_theme_store();

	const modes = [
		{ value: 'light' as const, Icon: Sun, label: 'Light' },
		{ value: 'dark' as const, Icon: Moon, label: 'Dark' },
		{ value: 'system' as const, Icon: Monitor, label: 'System' },
	];

	function cycle_mode() {
		const current_index = modes.findIndex((m) => m.value === theme.mode);
		theme.mode = modes[(current_index + 1) % modes.length].value;
	}

	const current_mode = $derived(modes.find((m) => m.value === theme.mode)!);
</script>

{#if collapsed}
	<button
		onclick={cycle_mode}
		class="flex w-full items-center justify-center rounded p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
		aria-label="{current_mode.label} theme"
		title="{current_mode.label} mode"
	>
		<current_mode.Icon class="size-4" />
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

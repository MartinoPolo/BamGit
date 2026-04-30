<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useBoard } from '$lib/modules/board';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Monitor from '@lucide/svelte/icons/monitor';

	interface Props {
		collapsed?: boolean;
	}

	let { collapsed = false }: Props = $props();

	const boardStore = useBoard();
	const theme = boardStore.theme;

	const modes = [
		{ value: 'light' as const, Icon: Sun, labelKey: 'light' as const },
		{ value: 'dark' as const, Icon: Moon, labelKey: 'dark' as const },
		{ value: 'system' as const, Icon: Monitor, labelKey: 'system' as const },
	];

	const MODE_LABELS = {
		light: () => m.theme_light(),
		dark: () => m.theme_dark(),
		system: () => m.theme_system(),
	} as const;

	function cycleMode() {
		const currentIndex = modes.findIndex((mode) => mode.value === theme.mode);
		theme.mode = modes[(currentIndex + 1) % modes.length].value;
	}

	const currentMode = $derived(modes.find((mode) => mode.value === theme.mode)!);
</script>

{#if collapsed}
	<button
		onclick={cycleMode}
		class="flex w-full items-center justify-center rounded p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
		aria-label="{MODE_LABELS[currentMode.labelKey]()} theme"
		title="{MODE_LABELS[currentMode.labelKey]()} mode"
	>
		<currentMode.Icon class="size-4" />
	</button>
{:else}
	<div class="flex items-center gap-1 rounded-md bg-secondary p-1">
		{#each modes as { value, Icon, labelKey } (value)}
			<button
				onclick={() => (theme.mode = value)}
				class="flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs transition-colors {theme.mode ===
				value
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				title="{MODE_LABELS[labelKey]()} mode"
			>
				<Icon class="size-3.5" />
				<span>{MODE_LABELS[labelKey]()}</span>
			</button>
		{/each}
	</div>
{/if}

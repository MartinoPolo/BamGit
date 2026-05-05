<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useBoard } from '$lib/modules/board';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Monitor from '@lucide/svelte/icons/monitor';
	import SidebarCollapsedItem from './SidebarCollapsedItem.svelte';
	import { Tabs, Tab } from '$lib/components/ui/tabs/index.js';
	import { SimpleTooltip } from '$lib/components/ui/tooltip/index.js';

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
	<SidebarCollapsedItem
		icon={currentMode.Icon}
		label="{MODE_LABELS[currentMode.labelKey]()} mode"
		onclick={cycleMode}
	/>
{:else}
	<Tabs class="w-full [&>*]:flex-1 [&>*]:justify-center">
		{#each modes as { value, Icon, labelKey } (value)}
			<SimpleTooltip text="{MODE_LABELS[labelKey]()} mode">
				<Tab active={theme.mode === value} onclick={() => (theme.mode = value)}>
					<Icon class="size-3.5" />
					<span>{MODE_LABELS[labelKey]()}</span>
				</Tab>
			</SimpleTooltip>
		{/each}
	</Tabs>
{/if}

<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useSettings } from '$lib/modules/settings';
	import type { ThemeMode } from '$lib/modules/board';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Monitor from '@lucide/svelte/icons/monitor';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import SidebarCollapsedItem from '$lib/components/derived/sidebar-collapsed-item/SidebarCollapsedItem.svelte';
	import * as Tabs from '$lib/components/shadcn/tabs/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import type { ButtonSize } from '$lib/components/shadcn/button/button-variants.js';

	interface Props {
		collapsed?: boolean;
		compact?: boolean;
		size?: ButtonSize;
		class?: string;
	}

	let {
		collapsed = false,
		compact = false,
		size = 'icon' as const,
		class: className,
	}: Props = $props();

	const settingsCtx = useSettings();
	const themeMode = $derived(settingsCtx.getThemeMode() as ThemeMode);

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
		const currentIndex = modes.findIndex((mode) => mode.value === themeMode);
		void settingsCtx.set('themeMode', modes[(currentIndex + 1) % modes.length].value);
	}

	const currentMode = $derived(modes.find((mode) => mode.value === themeMode)!);
</script>

{#if compact}
	<SimpleTooltip text="{MODE_LABELS[currentMode.labelKey]()} mode" side="bottom">
		{#snippet asChild(props)}
			<Button
				{...props}
				intent="ghost"
				{size}
				onclick={cycleMode}
				aria-label="{MODE_LABELS[currentMode.labelKey]()} mode"
				class={className}
			>
				<currentMode.Icon data-icon="inline-start" />
			</Button>
		{/snippet}
	</SimpleTooltip>
{:else if collapsed}
	<SidebarCollapsedItem
		icon={currentMode.Icon}
		label="{MODE_LABELS[currentMode.labelKey]()} mode"
		onclick={cycleMode}
	/>
{:else}
	<Tabs.Root value={themeMode} onValueChange={(v) => void settingsCtx.set('themeMode', v)}>
		<Tabs.List class="w-full *:flex-1 *:justify-center">
			{#each modes as { value, Icon, labelKey } (value)}
				<SimpleTooltip text="{MODE_LABELS[labelKey]()} mode">
					<Tabs.Trigger {value}>
						<Icon class="size-3.5" />
						<span>{MODE_LABELS[labelKey]()}</span>
					</Tabs.Trigger>
				</SimpleTooltip>
			{/each}
		</Tabs.List>
	</Tabs.Root>
{/if}

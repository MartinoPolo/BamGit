<script lang="ts">
	import { setBoardContext, ACCENT_COLORS } from '$lib/modules/board';
	import { setSettingsContext, useSettings } from '$lib/modules/settings';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	setSettingsContext();
	setBoardContext();
	const settingsCtx = useSettings();
	const themeMode = $derived(settingsCtx.getThemeMode());
	const accentColor = $derived(settingsCtx.getAccentColor());
</script>

<div
	class="flex flex-col gap-4 p-4"
	data-theme={settingsCtx.isDark ? 'dark' : 'light'}
	data-accent={accentColor}
>
	<div class="flex items-center gap-4 border-b border-border pb-3">
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-muted-foreground">Theme:</span>
			<button
				class="rounded px-2 py-1 text-xs {themeMode === 'light'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground'}"
				onclick={() => void settingsCtx.set('themeMode', 'light')}
			>
				Light
			</button>
			<button
				class="rounded px-2 py-1 text-xs {themeMode === 'dark'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground'}"
				onclick={() => void settingsCtx.set('themeMode', 'dark')}
			>
				Dark
			</button>
			<button
				class="rounded px-2 py-1 text-xs {themeMode === 'system'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground'}"
				onclick={() => void settingsCtx.set('themeMode', 'system')}
			>
				System
			</button>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-muted-foreground">Accent:</span>
			{#each ACCENT_COLORS as accent (accent)}
				<button
					class="rounded px-2 py-1 text-xs capitalize {accentColor === accent
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'}"
					onclick={() => void settingsCtx.set('accentColor', accent)}
				>
					{accent}
				</button>
			{/each}
		</div>
	</div>
	<Tooltip.Provider delayDuration={600} skipDelayDuration={300}>
		<div class="rounded-lg bg-background p-6 text-foreground">
			{@render children()}
		</div>
	</Tooltip.Provider>
</div>

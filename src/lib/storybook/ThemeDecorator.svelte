<script lang="ts">
	import { setBoardContext, useBoard, ACCENT_COLORS } from '$lib/modules/board';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	setBoardContext();
	const boardStore = useBoard();
	const theme = boardStore.theme;
</script>

<div
	class="flex flex-col gap-4 p-4"
	data-theme={theme.isDark ? 'dark' : 'light'}
	data-accent={theme.accent}
>
	<div class="flex items-center gap-4 border-b border-border pb-3">
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-muted-foreground">Theme:</span>
			<button
				class="rounded px-2 py-1 text-xs {theme.mode === 'light'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground'}"
				onclick={() => (theme.mode = 'light')}
			>
				Light
			</button>
			<button
				class="rounded px-2 py-1 text-xs {theme.mode === 'dark'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground'}"
				onclick={() => (theme.mode = 'dark')}
			>
				Dark
			</button>
			<button
				class="rounded px-2 py-1 text-xs {theme.mode === 'system'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground'}"
				onclick={() => (theme.mode = 'system')}
			>
				System
			</button>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-muted-foreground">Accent:</span>
			{#each ACCENT_COLORS as accent (accent)}
				<button
					class="rounded px-2 py-1 text-xs capitalize {theme.accent === accent
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'}"
					onclick={() => (theme.accent = accent)}
				>
					{accent}
				</button>
			{/each}
		</div>
	</div>
	<Tooltip.Provider>
		<div class="rounded-lg bg-background p-6 text-foreground">
			{@render children()}
		</div>
	</Tooltip.Provider>
</div>

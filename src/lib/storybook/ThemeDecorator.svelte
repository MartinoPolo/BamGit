<script lang="ts">
	import { setThemeContext, useTheme } from '$lib/context/theme.context.svelte.js';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	setThemeContext();
	const theme = useTheme();
</script>

<div class="flex flex-col gap-4 p-4" class:dark={theme.isDark}>
	<div class="flex items-center gap-2 border-b border-border pb-3">
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
	<div class="rounded-lg bg-background p-6 text-foreground">
		{@render children()}
	</div>
</div>

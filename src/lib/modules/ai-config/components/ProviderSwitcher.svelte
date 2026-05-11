<script lang="ts">
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import type { ProviderKind } from '$lib/types/generated';
	import type { InstalledProvider } from '$lib/types/generated';

	const PROVIDER_LABELS: Record<ProviderKind, string> = {
		'claude-code': 'Claude Code',
		'open-code': 'OpenCode',
		codex: 'Codex',
		cursor: 'Cursor',
	};

	const aiConfig = useAiConfig();

	function getInstalled(kind: ProviderKind): InstalledProvider | undefined {
		return aiConfig.installedProviders.find((p) => p.kind === kind);
	}

	const providerKinds: ProviderKind[] = ['claude-code', 'open-code', 'codex', 'cursor'];
</script>

<div class="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1">
	{#each providerKinds as kind (kind)}
		{@const installed = getInstalled(kind)}
		{@const isInstalled = installed?.installed ?? false}
		{@const isActive = aiConfig.provider === kind}

		{#if isInstalled}
			<Button
				variant={isActive ? 'secondary' : 'ghost'}
				size="sm"
				aria-pressed={isActive}
				onclick={() => aiConfig.setProvider(kind)}
				class="h-7 px-3 text-xs font-medium"
			>
				{PROVIDER_LABELS[kind]}
			</Button>
		{:else}
			<SimpleTooltip text="Not installed">
				<Button
					variant="ghost"
					size="sm"
					disabled
					aria-pressed={false}
					class="h-7 cursor-not-allowed px-3 text-xs font-medium opacity-40"
				>
					{PROVIDER_LABELS[kind]}
				</Button>
			</SimpleTooltip>
		{/if}
	{/each}
</div>

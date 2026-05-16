<script lang="ts">
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import * as ToggleGroup from '$lib/components/shadcn/toggle-group/index.js';
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

<ToggleGroup.Root
	type="single"
	value={aiConfig.provider}
	onValueChange={(value: string) => {
		if (value) {
			aiConfig.setProvider(value as ProviderKind);
		}
	}}
	size="sm"
	class="rounded-lg border border-border bg-surface-2 p-1"
>
	{#each providerKinds as kind (kind)}
		{@const installed = getInstalled(kind)}
		{@const isInstalled = installed?.installed ?? false}

		{#if isInstalled}
			<ToggleGroup.Item value={kind} class="h-7 px-3 text-xs font-medium">
				{PROVIDER_LABELS[kind]}
			</ToggleGroup.Item>
		{:else}
			<SimpleTooltip text="Not installed">
				<ToggleGroup.Item
					value={kind}
					disabled
					class="h-7 cursor-not-allowed px-3 text-xs font-medium opacity-40"
				>
					{PROVIDER_LABELS[kind]}
				</ToggleGroup.Item>
			</SimpleTooltip>
		{/if}
	{/each}
</ToggleGroup.Root>

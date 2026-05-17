<script lang="ts">
	import { onMount } from 'svelte';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import {
		setAiConfigContext,
		TAB_LABELS,
		type AiConfigTab,
	} from '$lib/modules/ai-config/ai_config.context.svelte.js';
	import {
		sortItems,
		groupItems,
		makeMcpKey,
		type ItemKind,
	} from '$lib/modules/ai-config/ai_config.helpers.js';
	import ProviderSwitcher from '$lib/modules/ai-config/components/ProviderSwitcher.svelte';
	import SourcesSection from '$lib/modules/ai-config/components/SourcesSection.svelte';
	import SortGroupToolbar from '$lib/modules/ai-config/components/SortGroupToolbar.svelte';
	import ItemCard from '$lib/modules/ai-config/components/ItemCard.svelte';
	import ItemListRow from '$lib/modules/ai-config/components/ItemListRow.svelte';
	import ItemDetailDialog from '$lib/modules/ai-config/components/ItemDetailDialog.svelte';
	import ItemEditDialog from '$lib/modules/ai-config/components/ItemEditDialog.svelte';
	import AiConfigDeleteDialog from '$lib/modules/ai-config/components/AiConfigDeleteDialog.svelte';
	import SettingsPanel from '$lib/modules/ai-config/components/SettingsPanel.svelte';
	import { SearchField } from '$lib/components/base/search-field/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as Tabs from '$lib/components/shadcn/tabs/index.js';
	import * as Alert from '$lib/components/shadcn/alert/index.js';
	import { cn } from '$lib/utils.js';
	import type {
		SkillConfig,
		AgentConfig,
		HookConfig,
		McpServerConfig,
		MemoryConfig,
		InstructionConfig,
		RuleConfig,
	} from '$lib/types/generated';

	// ─── Types ────────────────────────────────────────────────────────────────

	type McpItemWithPath = McpServerConfig & { file_path: string };

	// ─── Constants ────────────────────────────────────────────────────────────

	const TAB_KIND = {
		skills: 'skill',
		agents: 'agent',
		hooks: 'hook',
		mcp_servers: 'mcp',
		memories: 'memory',
		instructions: 'instruction',
		rules: 'rule',
	} as const satisfies Record<Exclude<AiConfigTab, 'all' | 'settings'>, ItemKind>;

	// ─── Context ─────────────────────────────────────────────────────────────

	const aiConfig = setAiConfigContext();

	// ─── Derived ─────────────────────────────────────────────────────────────

	const mcpItems = $derived(
		aiConfig.filteredMcpServers.map(
			(s): McpItemWithPath => ({
				...s,
				file_path: makeMcpKey(s),
			}),
		),
	);

	const activeTab = $derived(aiConfig.activeTab);

	const skillsDisplay = $derived.by(() => {
		const sorted = sortItems(aiConfig.filteredSkills, aiConfig.sortByFor('skills'));
		return groupItems(sorted, aiConfig.groupByFor('skills'));
	});

	const agentsDisplay = $derived.by(() => {
		const sorted = sortItems(aiConfig.filteredAgents, aiConfig.sortByFor('agents'));
		return groupItems(sorted, aiConfig.groupByFor('agents'));
	});

	const hooksDisplay = $derived.by(() => {
		const sorted = sortItems(aiConfig.filteredHooks, aiConfig.sortByFor('hooks'));
		return groupItems(sorted, aiConfig.groupByFor('hooks'));
	});

	const mcpDisplay = $derived.by(() => {
		const sorted = sortItems(mcpItems, aiConfig.sortByFor('mcp_servers'));
		return groupItems(sorted, aiConfig.groupByFor('mcp_servers'));
	});

	const memoriesDisplay = $derived.by(() => {
		const sorted = sortItems(aiConfig.filteredMemories, aiConfig.sortByFor('memories'));
		return groupItems(sorted, aiConfig.groupByFor('memories'));
	});

	const instructionsDisplay = $derived.by(() => {
		const sorted = sortItems(aiConfig.filteredInstructions, aiConfig.sortByFor('instructions'));
		return groupItems(sorted, aiConfig.groupByFor('instructions'));
	});

	const rulesDisplay = $derived.by(() => {
		const sorted = sortItems(aiConfig.filteredRules, aiConfig.sortByFor('rules'));
		return groupItems(sorted, aiConfig.groupByFor('rules'));
	});

	// ─── Effects ─────────────────────────────────────────────────────────────

	$effect(() => {
		const tabs = aiConfig.visibleTabs;
		if (!tabs.includes(aiConfig.activeTab)) {
			aiConfig.activeTab = tabs[0] ?? 'skills';
		}
	});

	// ─── Lifecycle ────────────────────────────────────────────────────────────

	onMount(() => {
		void aiConfig.init(undefined);
	});
</script>

<div class="flex h-full flex-col overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-border px-6 py-4">
		<div>
			<h1 class="text-lg font-semibold">AI Configuration</h1>
			<p class="text-sm text-muted-foreground">
				Browse and edit skills, agents, hooks, MCP servers, rules, memories, and
				instructions across providers.
			</p>
		</div>
		<Button
			intent="ghost"
			size="icon-sm"
			aria-label="Refresh"
			onclick={() => void aiConfig.discover()}
			disabled={aiConfig.loading}
		>
			{#if aiConfig.loading}
				<LoaderCircleIcon class="animate-spin" data-icon="inline-end" />
			{:else}
				<RefreshCwIcon data-icon="inline-end" />
			{/if}
		</Button>
	</div>

	<!-- Provider switcher -->
	<div class="border-b border-border px-6 py-3">
		<ProviderSwitcher />
	</div>

	<!-- Search -->
	<div class="border-b border-border px-6 py-3">
		<SearchField
			bind:value={aiConfig.searchQuery}
			placeholder="Search across all categories…"
			class="max-w-md"
		/>
	</div>

	<!-- Tabs row -->
	<Tabs.Root
		class="flex w-full gap-1 overflow-x-auto border-b border-border bg-transparent px-6 py-2"
	>
		{#each aiConfig.visibleTabs as tab (tab)}
			{@const count = aiConfig.tabCounts[tab]}
			{@const isActive = activeTab === tab}
			{@const isDimmed = tab !== 'settings' && count === 0 && aiConfig.searchQuery !== ''}
			<Tabs.Tab
				active={isActive}
				onclick={() => (aiConfig.activeTab = tab)}
				class={cn(isDimmed && 'text-foreground-subtle opacity-60')}
			>
				{TAB_LABELS[tab]}{tab !== 'settings' ? ` (${count})` : ''}
			</Tabs.Tab>
		{/each}
	</Tabs.Root>

	<!-- Body: sources + toolbar + content -->
	<div class="flex-1 overflow-y-auto">
		<div class="flex flex-col gap-4 px-6 py-4">
			<!-- Sources section (hidden on settings tab) -->
			{#if activeTab !== 'settings'}
				<SourcesSection />
			{/if}

			<!-- Toolbar (hidden for 'all' and 'settings') -->
			{#if activeTab !== 'all' && activeTab !== 'settings'}
				<SortGroupToolbar tab={activeTab} />
			{/if}

			<!-- Loading state -->
			{#if aiConfig.loading && aiConfig.discoveryResult === null}
				<div class="flex items-center justify-center py-12">
					<LoaderCircleIcon class="animate-spin text-muted-foreground" />
					<span class="ml-2 text-muted-foreground">Discovering AI configuration…</span>
				</div>

				<!-- Error state -->
			{:else if aiConfig.error !== null}
				<Alert.Root tone="destructive">
					<Alert.Title>Discovery failed</Alert.Title>
					<Alert.Description>{aiConfig.error}</Alert.Description>
				</Alert.Root>

				<!-- Settings tab -->
			{:else if activeTab === 'settings'}
				<SettingsPanel />

				<!-- All tab (only visible when searching) -->
			{:else if activeTab === 'all'}
				{@const allSections = [
					{
						label: 'Skills',
						items: aiConfig.filteredSkills as (
							| SkillConfig
							| AgentConfig
							| HookConfig
							| McpItemWithPath
							| MemoryConfig
							| InstructionConfig
							| RuleConfig
						)[],
						kind: 'skill' as ItemKind,
					},
					{
						label: 'Agents',
						items: aiConfig.filteredAgents as (
							| SkillConfig
							| AgentConfig
							| HookConfig
							| McpItemWithPath
							| MemoryConfig
							| InstructionConfig
							| RuleConfig
						)[],
						kind: 'agent' as ItemKind,
					},
					{
						label: 'Hooks',
						items: aiConfig.filteredHooks as (
							| SkillConfig
							| AgentConfig
							| HookConfig
							| McpItemWithPath
							| MemoryConfig
							| InstructionConfig
							| RuleConfig
						)[],
						kind: 'hook' as ItemKind,
					},
					{
						label: 'MCP Servers',
						items: mcpItems as (
							| SkillConfig
							| AgentConfig
							| HookConfig
							| McpItemWithPath
							| MemoryConfig
							| InstructionConfig
							| RuleConfig
						)[],
						kind: 'mcp' as ItemKind,
					},
					{
						label: 'Memories',
						items: aiConfig.filteredMemories as (
							| SkillConfig
							| AgentConfig
							| HookConfig
							| McpItemWithPath
							| MemoryConfig
							| InstructionConfig
							| RuleConfig
						)[],
						kind: 'memory' as ItemKind,
					},
					{
						label: 'Instructions',
						items: aiConfig.filteredInstructions as (
							| SkillConfig
							| AgentConfig
							| HookConfig
							| McpItemWithPath
							| MemoryConfig
							| InstructionConfig
							| RuleConfig
						)[],
						kind: 'instruction' as ItemKind,
					},
					{
						label: 'Rules',
						items: aiConfig.filteredRules as (
							| SkillConfig
							| AgentConfig
							| HookConfig
							| McpItemWithPath
							| MemoryConfig
							| InstructionConfig
							| RuleConfig
						)[],
						kind: 'rule' as ItemKind,
					},
				]}
				<div class="flex flex-col gap-6">
					{#each allSections as section (section.label)}
						{#if section.items.length > 0}
							<div class="flex flex-col gap-2">
								<h2 class="text-sm font-semibold text-foreground-muted">
									{section.label} ({section.items.length})
								</h2>
								<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
									{#each section.items as item (item.file_path)}
										<ItemCard
											{item}
											kind={section.kind}
											onSelect={() =>
												(aiConfig.selectedItemPath = item.file_path)}
										/>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<!-- Skills tab -->
			{:else if activeTab === 'skills'}
				{#if aiConfig.filteredSkills.length === 0}
					<p class="py-8 text-center text-muted-foreground">
						No items found for this provider.
					</p>
				{:else if aiConfig.viewModeFor('skills') === 'card'}
					<div class="flex flex-col gap-4">
						{#each skillsDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
								{#each groupItems as item (item.file_path)}
									<ItemCard
										{item}
										kind={TAB_KIND.skills}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each skillsDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2 px-1">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div
								class="flex flex-col gap-1 rounded-md border border-border bg-surface p-2"
							>
								{#each groupItems as item (item.file_path)}
									<ItemListRow
										{item}
										kind={TAB_KIND.skills}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Agents tab -->
			{:else if activeTab === 'agents'}
				{#if aiConfig.filteredAgents.length === 0}
					<p class="py-8 text-center text-muted-foreground">
						No items found for this provider.
					</p>
				{:else if aiConfig.viewModeFor('agents') === 'card'}
					<div class="flex flex-col gap-4">
						{#each agentsDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
								{#each groupItems as item (item.file_path)}
									<ItemCard
										{item}
										kind={TAB_KIND.agents}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each agentsDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2 px-1">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div
								class="flex flex-col gap-1 rounded-md border border-border bg-surface p-2"
							>
								{#each groupItems as item (item.file_path)}
									<ItemListRow
										{item}
										kind={TAB_KIND.agents}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Hooks tab -->
			{:else if activeTab === 'hooks'}
				{#if aiConfig.filteredHooks.length === 0}
					<p class="py-8 text-center text-muted-foreground">
						No items found for this provider.
					</p>
				{:else if aiConfig.viewModeFor('hooks') === 'card'}
					<div class="flex flex-col gap-4">
						{#each hooksDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
								{#each groupItems as item (item.file_path)}
									<ItemCard
										{item}
										kind={TAB_KIND.hooks}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each hooksDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2 px-1">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div
								class="flex flex-col gap-1 rounded-md border border-border bg-surface p-2"
							>
								{#each groupItems as item (item.file_path)}
									<ItemListRow
										{item}
										kind={TAB_KIND.hooks}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				<!-- MCP Servers tab -->
			{:else if activeTab === 'mcp_servers'}
				{#if mcpItems.length === 0}
					<p class="py-8 text-center text-muted-foreground">
						No items found for this provider.
					</p>
				{:else if aiConfig.viewModeFor('mcp_servers') === 'card'}
					<div class="flex flex-col gap-4">
						{#each mcpDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
								{#each groupItems as item (item.file_path)}
									<ItemCard
										{item}
										kind={TAB_KIND.mcp_servers}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each mcpDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2 px-1">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div
								class="flex flex-col gap-1 rounded-md border border-border bg-surface p-2"
							>
								{#each groupItems as item (item.file_path)}
									<ItemListRow
										{item}
										kind={TAB_KIND.mcp_servers}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Memories tab -->
			{:else if activeTab === 'memories'}
				{#if aiConfig.filteredMemories.length === 0}
					<p class="py-8 text-center text-muted-foreground">
						No items found for this provider.
					</p>
				{:else if aiConfig.viewModeFor('memories') === 'card'}
					<div class="flex flex-col gap-4">
						{#each memoriesDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
								{#each groupItems as item (item.file_path)}
									<ItemCard
										{item}
										kind={TAB_KIND.memories}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each memoriesDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2 px-1">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div
								class="flex flex-col gap-1 rounded-md border border-border bg-surface p-2"
							>
								{#each groupItems as item (item.file_path)}
									<ItemListRow
										{item}
										kind={TAB_KIND.memories}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Instructions tab -->
			{:else if activeTab === 'instructions'}
				{#if aiConfig.filteredInstructions.length === 0}
					<p class="py-8 text-center text-muted-foreground">
						No items found for this provider.
					</p>
				{:else if aiConfig.viewModeFor('instructions') === 'card'}
					<div class="flex flex-col gap-4">
						{#each instructionsDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
								{#each groupItems as item (item.file_path)}
									<ItemCard
										{item}
										kind={TAB_KIND.instructions}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each instructionsDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2 px-1">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div
								class="flex flex-col gap-1 rounded-md border border-border bg-surface p-2"
							>
								{#each groupItems as item (item.file_path)}
									<ItemListRow
										{item}
										kind={TAB_KIND.instructions}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Rules tab -->
			{:else if activeTab === 'rules'}
				{#if aiConfig.filteredRules.length === 0}
					<p class="py-8 text-center text-muted-foreground">
						No items found for this provider.
					</p>
				{:else if aiConfig.viewModeFor('rules') === 'card'}
					<div class="flex flex-col gap-4">
						{#each rulesDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
								{#each groupItems as item (item.file_path)}
									<ItemCard
										{item}
										kind={TAB_KIND.rules}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each rulesDisplay as [groupKey, groupItems] (groupKey)}
							{#if groupKey !== 'all'}
								<div class="flex items-center gap-2 px-1">
									<span
										class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
										>{groupKey}</span
									>
									<span class="text-xs text-foreground-subtle"
										>({groupItems.length})</span
									>
								</div>
							{/if}
							<div
								class="flex flex-col gap-1 rounded-md border border-border bg-surface p-2"
							>
								{#each groupItems as item (item.file_path)}
									<ItemListRow
										{item}
										kind={TAB_KIND.rules}
										onSelect={() =>
											(aiConfig.selectedItemPath = item.file_path)}
									/>
								{/each}
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<ItemDetailDialog />
<ItemEditDialog />
<AiConfigDeleteDialog />

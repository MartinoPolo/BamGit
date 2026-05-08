<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { invoke } from '$lib/tauri.js';
	import { renderMarkdown } from '$lib/modules/chat/markdown_renderer.js';
	import { setAiConfigContext, AI_CONFIG_TABS, TAB_LABELS } from '$lib/modules/ai-config';
	import type {
		SkillConfig,
		AgentConfig,
		HookConfig,
		McpServerConfig,
		MemoryConfig,
		InstructionConfig,
		ConfigSource,
	} from '$lib/types/generated';
	import { Card } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Tabs, Tab } from '$lib/components/ui/tabs/index.js';
	import { SearchField } from '$lib/components/ui/search-field/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import FileIcon from '@lucide/svelte/icons/file';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	const ctx = setAiConfigContext();

	let sheetOpen = $state(false);

	const SOURCE_BADGE_VARIANT: Record<ConfigSource, 'info' | 'moss' | 'amber'> = {
		user: 'info',
		project: 'moss',
		custom: 'amber',
	};

	const SOURCE_LABELS: Record<ConfigSource, () => string> = {
		user: () => m.ai_config_source_user(),
		project: () => m.ai_config_source_project(),
		custom: () => m.ai_config_source_custom(),
	};

	const MEMORY_TYPE_VARIANT: Record<string, 'info' | 'moss' | 'amber' | 'default'> = {
		user: 'info',
		feedback: 'amber',
		project: 'moss',
		reference: 'default',
	};

	// ─── Selected item for sheet detail ─────────────────────────────────────

	type SelectedItem =
		| { type: 'skill'; item: SkillConfig }
		| { type: 'agent'; item: AgentConfig }
		| { type: 'hook'; item: HookConfig }
		| { type: 'mcp_server'; item: McpServerConfig }
		| { type: 'memory'; item: MemoryConfig }
		| { type: 'instruction'; item: InstructionConfig };

	let selectedItem = $state<SelectedItem | null>(null);

	function selectItem(item: SelectedItem) {
		selectedItem = item;
		sheetOpen = true;
	}

	// ─── File actions ───────────────────────────────────────────────────────

	async function openFile(filePath: string) {
		try {
			const { openPath } = await import('@tauri-apps/plugin-opener');
			await openPath(filePath);
		} catch {
			// Browser mode — no-op
		}
	}

	async function openFolder(filePath: string) {
		try {
			const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
			await revealItemInDir(filePath);
		} catch {
			// Browser mode — no-op
		}
	}

	// ─── Custom path management ─────────────────────────────────────────────

	async function handleAddCustomPath() {
		try {
			const folderPath = await invoke<string | null>('pick_folder');
			if (folderPath !== null) {
				const segments = folderPath.replace(/\\/g, '/').split('/');
				const label = segments[segments.length - 1] || folderPath;
				await ctx.addCustomPath(label, folderPath);
				await ctx.discover();
			}
		} catch {
			// Browser mode
		}
	}

	async function handleRemoveCustomPath(path: string) {
		await ctx.removeCustomPath(path);
		await ctx.discover();
	}

	// ─── Detail content accessors ───────────────────────────────────────────

	const detailTitle = $derived.by(() => {
		if (selectedItem === null) {
			return '';
		}
		const item = selectedItem.item;
		return 'name' in item ? item.name : 'filename' in item ? item.filename : '';
	});

	const detailContent = $derived.by(() => {
		if (selectedItem === null) {
			return '';
		}
		const item = selectedItem.item;
		if ('content' in item) {
			return item.content;
		}
		if ('description' in item && item.description !== null) {
			return item.description;
		}
		return '';
	});

	const detailFilePath = $derived.by(() => {
		if (selectedItem === null) {
			return '';
		}
		const item = selectedItem.item;
		return 'file_path' in item ? item.file_path : '';
	});

	// ─── Lifecycle ──────────────────────────────────────────────────────────

	onMount(async () => {
		await ctx.loadCustomPaths();
		await ctx.discover();
	});
</script>

<Sheet.Root bind:open={sheetOpen}>
	<div class="flex h-full flex-col overflow-hidden">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border px-6 py-4">
			<div class="flex items-center gap-3">
				<SparklesIcon size={20} class="text-muted-foreground" />
				<h1 class="text-lg font-semibold">{m.ai_config_title()}</h1>
			</div>
			<Button
				variant="secondary"
				size="sm"
				onclick={async () => {
					await ctx.discover();
				}}
				disabled={ctx.loading}
			>
				{#if ctx.loading}
					<LoaderCircleIcon size={14} class="animate-spin" />
				{:else}
					<RefreshCwIcon size={14} />
				{/if}
				{m.ai_config_refresh()}
			</Button>
		</div>

		<!-- Search + Tabs -->
		<div class="space-y-3 border-b border-border px-6 py-3">
			<SearchField
				bind:value={ctx.searchQuery}
				placeholder={m.ai_config_search_placeholder()}
				class="max-w-md"
			/>
			<Tabs>
				{#each AI_CONFIG_TABS as tab (tab)}
					<Tab active={ctx.activeTab === tab} onclick={() => (ctx.activeTab = tab)}>
						{TAB_LABELS[tab]}
						<span class="ml-1 text-xs text-muted-foreground">
							({ctx.tabCounts[tab]})
						</span>
					</Tab>
				{/each}
			</Tabs>
		</div>

		<!-- Content area -->
		<div class="flex-1 overflow-y-auto p-6">
			{#if ctx.loading && ctx.discoveryResult === null}
				<div class="flex items-center justify-center py-12">
					<LoaderCircleIcon size={14} class="animate-spin" />
					<span class="ml-2 text-muted-foreground">{m.loading()}</span>
				</div>
			{:else if ctx.error !== null}
				<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
					<p class="text-sm text-destructive">{m.error_prefix({ message: ctx.error })}</p>
				</div>
			{:else}
				<!-- Skills tab -->
				{#if ctx.activeTab === 'skills'}
					{#if ctx.filteredSkills.length === 0}
						<p class="py-8 text-center text-muted-foreground">
							{m.ai_config_no_items()}
						</p>
					{:else}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
							{#each ctx.filteredSkills as skill (skill.file_path)}
								<button
									class="text-left"
									onclick={() => selectItem({ type: 'skill', item: skill })}
								>
									<Card
										padding="padded"
										class="h-full transition-colors hover:bg-accent/50"
									>
										<div class="flex flex-col gap-2">
											<div class="flex items-start justify-between gap-2">
												<h3 class="truncate font-medium">{skill.name}</h3>
												<Badge
													variant={SOURCE_BADGE_VARIANT[skill.source]}
													size="compact"
												>
													{SOURCE_LABELS[skill.source]()}
												</Badge>
											</div>
											{#if skill.description}
												<p
													class="line-clamp-2 text-sm text-muted-foreground"
												>
													{skill.description}
												</p>
											{/if}
											<div class="flex flex-wrap gap-1.5">
												{#if skill.category}
													<Badge variant="mono" size="compact"
														>{skill.category}</Badge
													>
												{/if}
												{#if skill.version}
													<Badge variant="mono" size="compact"
														>v{skill.version}</Badge
													>
												{/if}
												{#if skill.disable_model_invocation}
													<Badge variant="warning" size="compact"
														>manual only</Badge
													>
												{/if}
											</div>
										</div>
									</Card>
								</button>
							{/each}
						</div>
					{/if}

					<!-- Agents tab -->
				{:else if ctx.activeTab === 'agents'}
					{#if ctx.filteredAgents.length === 0}
						<p class="py-8 text-center text-muted-foreground">
							{m.ai_config_no_items()}
						</p>
					{:else}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
							{#each ctx.filteredAgents as agent (agent.file_path)}
								<button
									class="text-left"
									onclick={() => selectItem({ type: 'agent', item: agent })}
								>
									<Card
										padding="padded"
										class="h-full transition-colors hover:bg-accent/50"
									>
										<div class="flex flex-col gap-2">
											<div class="flex items-start justify-between gap-2">
												<h3 class="truncate font-medium">{agent.name}</h3>
												<Badge
													variant={SOURCE_BADGE_VARIANT[agent.source]}
													size="compact"
												>
													{SOURCE_LABELS[agent.source]()}
												</Badge>
											</div>
											{#if agent.description}
												<p
													class="line-clamp-2 text-sm text-muted-foreground"
												>
													{agent.description}
												</p>
											{/if}
											<div class="flex flex-wrap gap-1.5">
												{#if agent.model}
													<Badge variant="mono" size="compact"
														>{agent.model}</Badge
													>
												{/if}
												{#if agent.tools}
													<Badge variant="mono" size="compact">
														{agent.tools.length} tools
													</Badge>
												{/if}
											</div>
										</div>
									</Card>
								</button>
							{/each}
						</div>
					{/if}

					<!-- Hooks tab -->
				{:else if ctx.activeTab === 'hooks'}
					{#if ctx.filteredHooks.length === 0}
						<p class="py-8 text-center text-muted-foreground">
							{m.ai_config_no_items()}
						</p>
					{:else}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
							{#each ctx.filteredHooks as hook (hook.file_path + hook.event_type + (hook.matcher ?? ''))}
								<button
									class="text-left"
									onclick={() => selectItem({ type: 'hook', item: hook })}
								>
									<Card
										padding="padded"
										class="h-full transition-colors hover:bg-accent/50"
									>
										<div class="flex flex-col gap-2">
											<div class="flex items-start justify-between gap-2">
												<h3 class="truncate font-medium">
													{hook.filename}
												</h3>
												<Badge
													variant={SOURCE_BADGE_VARIANT[hook.source]}
													size="compact"
												>
													{SOURCE_LABELS[hook.source]()}
												</Badge>
											</div>
											{#if hook.description}
												<p
													class="line-clamp-2 text-sm text-muted-foreground"
												>
													{hook.description}
												</p>
											{/if}
											<div class="flex flex-wrap gap-1.5">
												<Badge variant="default" size="compact"
													>{hook.event_type}</Badge
												>
												{#if hook.matcher}
													<Badge variant="mono" size="compact"
														>{hook.matcher}</Badge
													>
												{/if}
												{#if hook.timeout !== null}
													<Badge variant="mono" size="compact"
														>{hook.timeout}ms</Badge
													>
												{/if}
											</div>
										</div>
									</Card>
								</button>
							{/each}
						</div>
					{/if}

					<!-- MCP Servers tab -->
				{:else if ctx.activeTab === 'mcp_servers'}
					{#if ctx.filteredMcpServers.length === 0}
						<p class="py-8 text-center text-muted-foreground">
							{m.ai_config_no_items()}
						</p>
					{:else}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
							{#each ctx.filteredMcpServers as server (server.name + server.provider)}
								<button
									class="text-left"
									onclick={() => selectItem({ type: 'mcp_server', item: server })}
								>
									<Card
										padding="padded"
										class="h-full transition-colors hover:bg-accent/50"
									>
										<div class="flex flex-col gap-2">
											<div class="flex items-start justify-between gap-2">
												<h3 class="truncate font-medium">{server.name}</h3>
												<div class="flex gap-1">
													<Badge
														variant={server.enabled
															? 'success'
															: 'danger'}
														size="compact"
													>
														{server.enabled ? 'enabled' : 'disabled'}
													</Badge>
													<Badge
														variant={SOURCE_BADGE_VARIANT[
															server.source
														]}
														size="compact"
													>
														{SOURCE_LABELS[server.source]()}
													</Badge>
												</div>
											</div>
											<div class="flex flex-wrap gap-1.5">
												<Badge variant="mono" size="compact"
													>{server.transport_type}</Badge
												>
												<Badge variant="mono" size="compact"
													>{server.provider}</Badge
												>
												{#if server.env_var_names}
													<Badge variant="mono" size="compact">
														{server.env_var_names.length} env vars
													</Badge>
												{/if}
											</div>
											{#if server.command}
												<p class="truncate text-xs text-muted-foreground">
													{server.command}
													{#if server.args}
														{server.args.join(' ')}{/if}
												</p>
											{/if}
										</div>
									</Card>
								</button>
							{/each}
						</div>
					{/if}

					<!-- Memories tab -->
				{:else if ctx.activeTab === 'memories'}
					{#if ctx.filteredMemories.length === 0}
						<p class="py-8 text-center text-muted-foreground">
							{m.ai_config_no_items()}
						</p>
					{:else}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
							{#each ctx.filteredMemories as memory (memory.file_path)}
								<button
									class="text-left"
									onclick={() => selectItem({ type: 'memory', item: memory })}
								>
									<Card
										padding="padded"
										class="h-full transition-colors hover:bg-accent/50"
									>
										<div class="flex flex-col gap-2">
											<div class="flex items-start justify-between gap-2">
												<h3 class="truncate font-medium">{memory.name}</h3>
												{#if memory.memory_type}
													<Badge
														variant={MEMORY_TYPE_VARIANT[
															memory.memory_type
														] ?? 'default'}
														size="compact"
													>
														{memory.memory_type}
													</Badge>
												{/if}
											</div>
											{#if memory.description}
												<p
													class="line-clamp-2 text-sm text-muted-foreground"
												>
													{memory.description}
												</p>
											{/if}
										</div>
									</Card>
								</button>
							{/each}
						</div>
					{/if}

					<!-- Instructions tab -->
				{:else if ctx.activeTab === 'instructions'}
					{#if ctx.filteredInstructions.length === 0}
						<p class="py-8 text-center text-muted-foreground">
							{m.ai_config_no_items()}
						</p>
					{:else}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
							{#each ctx.filteredInstructions as instruction (instruction.file_path)}
								<button
									class="text-left"
									onclick={() =>
										selectItem({ type: 'instruction', item: instruction })}
								>
									<Card
										padding="padded"
										class="h-full transition-colors hover:bg-accent/50"
									>
										<div class="flex flex-col gap-2">
											<div class="flex items-start justify-between gap-2">
												<h3 class="truncate font-medium">
													{instruction.filename}
												</h3>
												<Badge
													variant={SOURCE_BADGE_VARIANT[
														instruction.source
													]}
													size="compact"
												>
													{SOURCE_LABELS[instruction.source]()}
												</Badge>
											</div>
											<div class="flex flex-wrap gap-1.5">
												<Badge variant="mono" size="compact">
													{(instruction.file_size / 1024).toFixed(1)} KB
												</Badge>
												{#if instruction.last_modified}
													<Badge variant="mono" size="compact">
														{new Date(
															instruction.last_modified,
														).toLocaleDateString()}
													</Badge>
												{/if}
											</div>
										</div>
									</Card>
								</button>
							{/each}
						</div>
					{/if}
				{/if}

				<!-- Custom Discovery Sources -->
				<div class="mt-8 border-t border-border pt-6">
					<div class="flex items-center justify-between">
						<h2 class="text-sm font-semibold">{m.ai_config_discovery_sources()}</h2>
						<Button variant="secondary" size="sm" onclick={handleAddCustomPath}>
							<PlusIcon size={14} />
							{m.ai_config_add_folder()}
						</Button>
					</div>
					{#if ctx.customPaths.length > 0}
						<div class="mt-3 space-y-2">
							{#each ctx.customPaths as customPath (customPath.path)}
								<div
									class="flex items-center justify-between rounded-md border border-border px-3 py-2"
								>
									<div class="flex items-center gap-2 overflow-hidden">
										<FolderOpenIcon
											size={14}
											class="shrink-0 text-muted-foreground"
										/>
										<span class="truncate text-sm font-medium"
											>{customPath.label}</span
										>
										<span class="truncate text-xs text-muted-foreground">
											{customPath.path}
										</span>
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => handleRemoveCustomPath(customPath.path)}
									>
										<XIcon size={14} />
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Detail Sheet -->
	<Sheet.Content side="right" class="w-full sm:max-w-2xl">
		{#if selectedItem !== null}
			<Sheet.Header class="px-6">
				<Sheet.Title>{detailTitle}</Sheet.Title>
				{#if selectedItem.type === 'skill' && selectedItem.item.description}
					<Sheet.Description>{selectedItem.item.description}</Sheet.Description>
				{:else if selectedItem.type === 'agent' && selectedItem.item.description}
					<Sheet.Description>{selectedItem.item.description}</Sheet.Description>
				{:else if selectedItem.type === 'memory' && selectedItem.item.description}
					<Sheet.Description>{selectedItem.item.description}</Sheet.Description>
				{:else}
					<Sheet.Description class="sr-only">Detail view</Sheet.Description>
				{/if}
			</Sheet.Header>

			<div class="flex-1 overflow-y-auto px-6">
				<!-- Metadata badges -->
				<div class="mb-4 flex flex-wrap gap-1.5">
					{#if selectedItem.type === 'skill'}
						{@const skill = selectedItem.item}
						<Badge variant={SOURCE_BADGE_VARIANT[skill.source]}>
							{SOURCE_LABELS[skill.source]()}
						</Badge>
						{#if skill.category}
							<Badge variant="mono">{skill.category}</Badge>
						{/if}
						{#if skill.version}
							<Badge variant="mono">v{skill.version}</Badge>
						{/if}
						{#if skill.author}
							<Badge variant="mono">{skill.author}</Badge>
						{/if}
						{#if skill.allowed_tools}
							<Badge variant="mono">{skill.allowed_tools.length} tools</Badge>
						{/if}
					{:else if selectedItem.type === 'agent'}
						{@const agent = selectedItem.item}
						<Badge variant={SOURCE_BADGE_VARIANT[agent.source]}>
							{SOURCE_LABELS[agent.source]()}
						</Badge>
						{#if agent.model}
							<Badge variant="mono">{agent.model}</Badge>
						{/if}
						{#if agent.tools}
							{#each agent.tools as tool (tool)}
								<Badge variant="mono" size="compact">{tool}</Badge>
							{/each}
						{/if}
					{:else if selectedItem.type === 'hook'}
						{@const hook = selectedItem.item}
						<Badge variant={SOURCE_BADGE_VARIANT[hook.source]}>
							{SOURCE_LABELS[hook.source]()}
						</Badge>
						<Badge variant="default">{hook.event_type}</Badge>
						{#if hook.matcher}
							<Badge variant="mono">{hook.matcher}</Badge>
						{/if}
						{#if hook.timeout !== null}
							<Badge variant="mono">{hook.timeout}ms</Badge>
						{/if}
					{:else if selectedItem.type === 'mcp_server'}
						{@const server = selectedItem.item}
						<Badge variant={server.enabled ? 'success' : 'danger'}>
							{server.enabled ? 'enabled' : 'disabled'}
						</Badge>
						<Badge variant={SOURCE_BADGE_VARIANT[server.source]}>
							{SOURCE_LABELS[server.source]()}
						</Badge>
						<Badge variant="mono">{server.transport_type}</Badge>
						<Badge variant="mono">{server.provider}</Badge>
					{:else if selectedItem.type === 'memory'}
						{@const memory = selectedItem.item}
						{#if memory.memory_type}
							<Badge variant={MEMORY_TYPE_VARIANT[memory.memory_type] ?? 'default'}>
								{memory.memory_type}
							</Badge>
						{/if}
					{:else if selectedItem.type === 'instruction'}
						{@const instruction = selectedItem.item}
						<Badge variant={SOURCE_BADGE_VARIANT[instruction.source]}>
							{SOURCE_LABELS[instruction.source]()}
						</Badge>
						<Badge variant="mono">
							{(instruction.file_size / 1024).toFixed(1)} KB
						</Badge>
						{#if instruction.last_modified}
							<Badge variant="mono">
								{new Date(instruction.last_modified).toLocaleDateString()}
							</Badge>
						{/if}
					{/if}
				</div>

				<!-- MCP server details -->
				{#if selectedItem.type === 'mcp_server'}
					{@const server = selectedItem.item}
					<div class="space-y-3 text-sm">
						{#if server.command}
							<div>
								<span class="font-medium text-muted-foreground">Command:</span>
								<code class="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
									{server.command}{#if server.args}
										{server.args.join(' ')}{/if}
								</code>
							</div>
						{/if}
						{#if server.url}
							<div>
								<span class="font-medium text-muted-foreground">URL:</span>
								<code class="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs"
									>{server.url}</code
								>
							</div>
						{/if}
						{#if server.env_var_names && server.env_var_names.length > 0}
							<div>
								<span class="font-medium text-muted-foreground"
									>Environment variables:</span
								>
								<div class="mt-1 flex flex-wrap gap-1">
									{#each server.env_var_names as envVar (envVar)}
										<Badge variant="mono" size="compact">{envVar}</Badge>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Skill allowed tools detail -->
				{#if selectedItem.type === 'skill' && selectedItem.item.allowed_tools}
					<div class="mb-4">
						<span class="text-sm font-medium text-muted-foreground">Allowed tools:</span
						>
						<div class="mt-1 flex flex-wrap gap-1">
							{#each selectedItem.item.allowed_tools as tool (tool)}
								<Badge variant="mono" size="compact">{tool}</Badge>
							{/each}
						</div>
					</div>
				{/if}

				{#if detailContent}
					<div class="prose prose-sm dark:prose-invert max-w-none">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html renderMarkdown(detailContent)}
					</div>
				{/if}
			</div>

			<!-- Footer with file actions -->
			{#if detailFilePath}
				<Sheet.Footer class="border-t border-border px-6">
					<div class="flex gap-2">
						<Button
							variant="secondary"
							size="sm"
							onclick={() => openFile(detailFilePath)}
						>
							<FileIcon size={14} />
							{m.ai_config_open_file()}
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onclick={() => openFolder(detailFilePath)}
						>
							<FolderOpenIcon size={14} />
							{m.ai_config_open_folder()}
						</Button>
					</div>
				</Sheet.Footer>
			{/if}
		{/if}
	</Sheet.Content>
</Sheet.Root>

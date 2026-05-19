<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as Collapsible from '$lib/components/shadcn/collapsible/index.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import { invoke } from '$lib/tauri.js';
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import { cn } from '$lib/utils.js';
	import type { DiscoverySource, CustomDiscoveryPath } from '$lib/types/generated';

	// ─── Context ─────────────────────────────────────────────────────────────

	const aiConfig = useAiConfig();

	// ─── State ────────────────────────────────────────────────────────────────

	let addDialogOpen = $state(false);
	let pendingPath = $state('');
	let pendingLabel = $state('');
	let isSaving = $state(false);

	// ─── Derived ─────────────────────────────────────────────────────────────

	const providerSources = $derived(
		aiConfig.discoveryResult?.sources?.filter(
			(s: DiscoverySource) => s.provider === aiConfig.provider,
		) ?? [],
	);

	const providerCustomPaths = $derived(
		aiConfig.customPaths.filter((p: CustomDiscoveryPath) => p.provider === aiConfig.provider),
	);

	const sourcesCount = $derived(providerSources.length + providerCustomPaths.length);

	function itemCountForSource(sourcePath: string): number {
		const result = aiConfig.discoveryResult;
		if (result === null) {
			return 0;
		}
		const allItems = [
			...result.skills,
			...result.agents,
			...result.hooks,
			...result.memories,
			...result.instructions,
			...result.rules,
		];
		return allItems.filter(
			(item) => 'file_path' in item && item.file_path.startsWith(sourcePath),
		).length;
	}

	function sourceDotClass(sourceType: string): string {
		if (sourceType === 'user') {
			return 'bg-blue-500/80';
		}
		if (sourceType === 'project') {
			return 'bg-green-500/80';
		}
		return 'bg-amber-500/80';
	}

	// ─── Functions ───────────────────────────────────────────────────────────

	async function handleAddSource(): Promise<void> {
		let chosenPath = pendingPath;

		if (!chosenPath) {
			try {
				const picked = await invoke<string | null>('pick_folder');
				if (picked === null) {
					return;
				}
				chosenPath = picked;
				pendingPath = picked;
			} catch {
				return;
			}
		}

		if (!chosenPath || !pendingLabel.trim()) {
			return;
		}

		isSaving = true;
		try {
			await aiConfig.addCustomPath(pendingLabel.trim(), chosenPath);
			addDialogOpen = false;
			pendingPath = '';
			pendingLabel = '';
		} finally {
			isSaving = false;
		}
	}

	async function handlePickFolder(): Promise<void> {
		try {
			const picked = await invoke<string | null>('pick_folder');
			if (picked !== null) {
				pendingPath = picked;
				if (!pendingLabel) {
					const parts = picked.replace(/\\/g, '/').split('/');
					pendingLabel = parts[parts.length - 1] ?? picked;
				}
			}
		} catch {
			// Picker cancelled or unavailable
		}
	}
</script>

<Collapsible.Root
	class="flex flex-col gap-2"
	open={aiConfig.sourcesExpanded}
	onOpenChange={(value) => {
		aiConfig.sourcesExpanded = value;
	}}
>
	<Collapsible.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				intent="ghost"
				size="sm"
				class="text-foreground-muted hover:text-foreground"
			>
				<ChevronRightIcon
					data-icon="inline-start"
					class={cn(
						'transition-transform duration-2',
						aiConfig.sourcesExpanded && 'rotate-90',
					)}
				/>
				Sources ({sourcesCount})
			</Button>
		{/snippet}
	</Collapsible.Trigger>

	<Collapsible.Content>
		<div class="flex flex-wrap items-center gap-1.5">
			{#each providerSources as source (source.path)}
				{@const count = itemCountForSource(source.path)}
				<div
					class="flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs"
				>
					<span
						class={cn(
							'size-1.5 shrink-0 rounded-full',
							sourceDotClass(source.source_type),
						)}
					></span>
					<span class="max-w-40 truncate text-foreground" title={source.path}>
						{source.label}
					</span>
					<span class="text-foreground-muted">({count})</span>
				</div>
			{/each}

			{#each providerCustomPaths as customPath (customPath.path)}
				{@const count = itemCountForSource(customPath.path)}
				<div
					class="flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs"
				>
					<span class="size-1.5 shrink-0 rounded-full bg-amber-500/80"></span>
					<span class="max-w-40 truncate text-foreground" title={customPath.path}>
						{customPath.label}
					</span>
					<span class="text-foreground-muted">({count})</span>
					<button
						type="button"
						aria-label="Remove source"
						class="ml-0.5 rounded-full p-0.5 hover:bg-surface-3"
						onclick={() => aiConfig.removeCustomPath(customPath.path)}
					>
						<XIcon class="size-2.5" />
					</button>
				</div>
			{/each}

			<Button
				intent="ghost"
				size="sm"
				class="h-6 gap-1 rounded-full px-2.5 text-xs"
				onclick={() => {
					addDialogOpen = true;
				}}
			>
				<PlusIcon data-icon="inline-start" />
				Add source
			</Button>
		</div>
	</Collapsible.Content>
</Collapsible.Root>

<!-- Add source dialog -->
<Dialog.Root bind:open={addDialogOpen}>
	<Dialog.Content class="max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Add custom source</Dialog.Title>
			<Dialog.Description>
				Add a custom directory to discover AI config files from.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Body class="flex flex-col gap-3">
			<div class="flex flex-col gap-1">
				<label class="text-xs font-medium text-foreground-muted" for="source-label">
					Label
				</label>
				<Input
					id="source-label"
					placeholder="My custom configs"
					bind:value={pendingLabel}
				/>
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-xs font-medium text-foreground-muted" for="source-path">
					Path
				</label>
				<div class="flex gap-2">
					<Input
						id="source-path"
						placeholder="/path/to/configs"
						bind:value={pendingPath}
						class="flex-1"
					/>
					<Button intent="secondary" size="sm" onclick={handlePickFolder}>Browse</Button>
				</div>
			</div>
		</Dialog.Body>
		<Dialog.Footer>
			<Button
				intent="ghost"
				onclick={() => {
					addDialogOpen = false;
				}}
			>
				Cancel
			</Button>
			<Button
				disabled={isSaving || !pendingLabel.trim() || !pendingPath.trim()}
				onclick={handleAddSource}
			>
				{isSaving ? 'Adding…' : 'Add'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

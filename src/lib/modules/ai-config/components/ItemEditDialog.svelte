<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { openPath } from '@tauri-apps/plugin-opener';
	import { invoke } from '$lib/tauri.js';
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import type { SymlinkInfo } from '$lib/types/generated';

	// ─── Context ─────────────────────────────────────────────────────────────

	const aiConfig = useAiConfig();

	// ─── State ────────────────────────────────────────────────────────────────

	let content = $state('');
	let isSaving = $state(false);
	let symlinkInfo = $state<SymlinkInfo | null>(null);

	// ─── Derived ─────────────────────────────────────────────────────────────

	const isOpen = $derived(aiConfig.editingItemPath !== null);

	const editingPath = $derived(aiConfig.editingItemPath);

	const itemName = $derived.by((): string => {
		const path = editingPath;
		if (path === null) {
			return '';
		}
		const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
		return lastSlash === -1 ? path : path.slice(lastSlash + 1);
	});

	const parentDir = $derived.by((): string | null => {
		const path = editingPath;
		if (path === null) {
			return null;
		}
		const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
		if (lastSlash === -1) {
			return null;
		}
		return path.slice(0, lastSlash);
	});

	// Find item from all discovery arrays
	// fallow-ignore-next-line complexity
	const editingItem = $derived.by(() => {
		const path = editingPath;
		const result = aiConfig.discoveryResult;
		if (path === null || result === null) {
			return null;
		}
		return (
			result.skills.find((s) => s.file_path === path) ??
			result.agents.find((a) => a.file_path === path) ??
			result.memories.find((m) => m.file_path === path) ??
			result.instructions.find((i) => i.file_path === path) ??
			result.rules.find((r) => r.file_path === path) ??
			null
		);
	});

	// ─── Effects ─────────────────────────────────────────────────────────────

	$effect(() => {
		const item = editingItem;
		const path = editingPath;

		if (item !== null && 'content' in item && typeof item.content === 'string') {
			content = item.content;
		} else {
			content = '';
		}

		if (path !== null) {
			symlinkInfo = null;
			void invoke<SymlinkInfo>('inspect_symlink', { path })
				.then((info) => {
					symlinkInfo = info;
				})
				.catch(() => {
					symlinkInfo = null;
				});
		} else {
			symlinkInfo = null;
		}
	});

	// ─── Functions ───────────────────────────────────────────────────────────

	async function handleSave(): Promise<void> {
		const path = editingPath;
		if (path === null) {
			return;
		}
		isSaving = true;
		try {
			await aiConfig.writeFile(path, content);
			aiConfig.editingItemPath = null;
		} finally {
			isSaving = false;
		}
	}

	async function handleOpenInEditor(): Promise<void> {
		const path = editingPath;
		if (path === null) {
			return;
		}
		try {
			await openPath(path);
		} catch {
			// Silently fail
		}
	}

	async function handleOpenFolder(): Promise<void> {
		const dir = parentDir;
		if (dir === null) {
			return;
		}
		try {
			await openPath(dir);
		} catch {
			// Silently fail
		}
	}
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(open) => {
		if (open === false) {
			aiConfig.editingItemPath = null;
		}
	}}
>
	<Dialog.Content class="flex h-[85vh] max-w-3xl flex-col overflow-hidden p-0">
		<Dialog.Header class="shrink-0">
			<div class="flex flex-col gap-0.5">
				<Dialog.Title>Edit {itemName}</Dialog.Title>
				{#if parentDir !== null}
					<button
						type="button"
						class="text-left font-mono text-xs text-foreground-muted hover:text-foreground hover:underline"
						onclick={handleOpenFolder}
					>
						{editingPath}
					</button>
				{:else if editingPath !== null}
					<span class="font-mono text-xs text-foreground-muted">{editingPath}</span>
				{/if}
			</div>
		</Dialog.Header>

		<Dialog.Body class="flex flex-1 flex-col gap-3 overflow-hidden">
			{#if symlinkInfo?.is_symlink === true && symlinkInfo.resolved_path !== null}
				<Alert.Root>
					<TriangleAlertIcon />
					<Alert.Title>Symlink detected</Alert.Title>
					<Alert.Description>
						This file is a symlink to {symlinkInfo.resolved_path}. Edits will be written
						to the symlink target.
						<!-- TODO: Add "Create local copy" option to copy symlink target into workspace -->
					</Alert.Description>
				</Alert.Root>
			{/if}

			{#if editingItem === null && editingPath !== null}
				<Alert.Root>
					<TriangleAlertIcon />
					<Alert.Title>Non-editable item</Alert.Title>
					<Alert.Description>
						This item type cannot be edited directly from this view.
					</Alert.Description>
				</Alert.Root>
			{/if}

			<Textarea
				bind:value={content}
				disabled={editingItem === null}
				class="flex-1 resize-none font-mono text-xs"
				spellcheck={false}
			/>
		</Dialog.Body>

		<Dialog.Footer class="shrink-0 justify-between">
			<Button variant="ghost" size="sm" onclick={handleOpenInEditor}>
				<FolderOpenIcon class="size-3.5" />
				Open in editor
			</Button>

			<div class="flex gap-2">
				<Button
					variant="ghost"
					onclick={() => {
						aiConfig.editingItemPath = null;
					}}
				>
					Cancel
				</Button>
				<Button disabled={isSaving || editingItem === null} onclick={handleSave}>
					{isSaving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

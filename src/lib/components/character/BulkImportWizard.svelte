<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { cn } from '$lib/utils.js';
	import EventSlotCard from './EventSlotCard.svelte';
	import TierSection from './TierSection.svelte';
	import LanguageSelect from './LanguageSelect.svelte';
	import {
		useCharacterPacks,
		getEventsByTier,
		type SoundPoolEntry,
		type SaveSoundAssignment,
	} from '$lib/modules/character-packs';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { invoke } from '$lib/tauri.js';
	import type { DetectedCharacter, FolderScanResult } from '$lib/types/generated';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import CheckIcon from '@lucide/svelte/icons/check';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	interface Props {
		open: boolean;
		onclose?: () => void;
		onimported?: () => void;
	}

	let { open = $bindable(false), onclose, onimported }: Props = $props();

	const characterPacks = useCharacterPacks();
	const eventsByTier = getEventsByTier();

	type WizardStep = 'scan' | 'review' | 'import';

	let step = $state<WizardStep>('scan');
	let scanResult = $state<FolderScanResult | null>(null);
	let scanning = $state(false);
	let importing = $state(false);
	let importProgress = $state(0);
	let importCurrentName = $state('');
	const selectedCharacters = new SvelteSet<string>();
	let selectedCharacterIndex = $state<number>(0);
	const expandedFactions = new SvelteSet<string>();
	const characterLanguages = new SvelteMap<string, string>();
	const characterAssignments = new SvelteMap<string, SvelteMap<string, SoundPoolEntry[]>>();
	let tierAccordionValue = $state<string[]>(['critical', 'important']);
	let playingSoundId = $state<string | null>(null);

	const characters = $derived(scanResult?.characters ?? []);

	const selectedCharacterList = $derived(
		characters.filter((c) => selectedCharacters.has(c.folder_path)),
	);

	const currentCharacter = $derived(selectedCharacterList[selectedCharacterIndex] ?? null);

	const readyCount = $derived(
		selectedCharacterList.filter((c) => getCharacterQuality(c) === 'ready').length,
	);

	const factions = $derived.by(() => {
		const groups = new SvelteMap<string, DetectedCharacter[]>();
		for (const char of characters) {
			const faction = char.parent_folder ?? '(root)';
			const existing = groups.get(faction) ?? [];
			groups.set(faction, [...existing, char]);
		}
		return groups;
	});

	function getCharacterQuality(char: DetectedCharacter): 'ready' | 'partial' | 'sparse' {
		const assignments = characterAssignments.get(char.folder_path);
		if (assignments === undefined) {
			const criticalCovered = eventsByTier
				.find((t) => t.tier === 'critical')
				?.events.every((e) =>
					char.proposed_mappings.some((m) => m.event_type === e.eventType),
				);
			return criticalCovered === true
				? 'ready'
				: char.proposed_mappings.length > 0
					? 'partial'
					: 'sparse';
		}
		const criticalEvents = eventsByTier.find((t) => t.tier === 'critical')?.events ?? [];
		const allCriticalFilled = criticalEvents.every((e) => {
			const sounds = assignments.get(e.eventType);
			return sounds !== undefined && sounds.length > 0;
		});
		return allCriticalFilled ? 'ready' : 'partial';
	}

	async function handleSelectFolder() {
		try {
			const folderPath = await invoke<string | null>('pick_folder');
			if (folderPath === null || folderPath === undefined) {
				return;
			}
			scanning = true;
			scanResult = await characterPacks.scanFolder(folderPath);

			selectedCharacters.clear();
			for (const c of characters) {
				selectedCharacters.add(c.folder_path);
			}

			for (const faction of factions.keys()) {
				expandedFactions.add(faction);
			}

			initializeAssignments();

			if (characters.length > 0) {
				step = 'review';
			}
		} catch (err) {
			console.error('Failed to scan folder:', err);
		} finally {
			scanning = false;
		}
	}

	function initializeAssignments() {
		characterAssignments.clear();
		let globalSoundId = 1;

		for (const char of characters) {
			const charAssignments = new SvelteMap<string, SoundPoolEntry[]>();

			for (const mapping of char.proposed_mappings) {
				const sound: SoundPoolEntry = {
					id: `bulk-${globalSoundId++}`,
					fileName: mapping.sound_file,
					relativePath: mapping.sound_file,
					fullPath: `${char.folder_path}/${mapping.sound_file}`,
					durationMs: null,
					assignedEventType: mapping.event_type,
				};

				const existing = charAssignments.get(mapping.event_type) ?? [];
				charAssignments.set(mapping.event_type, [...existing, sound]);
			}

			characterAssignments.set(char.folder_path, charAssignments);
		}
	}

	function handleToggleCharacter(folderPath: string, checked: boolean) {
		if (checked) {
			selectedCharacters.add(folderPath);
		} else {
			selectedCharacters.delete(folderPath);
		}
	}

	function handleToggleFaction(faction: string) {
		if (expandedFactions.has(faction)) {
			expandedFactions.delete(faction);
		} else {
			expandedFactions.add(faction);
		}
	}

	function handleSelectAll(checked: boolean) {
		selectedCharacters.clear();
		if (checked) {
			for (const c of characters) {
				selectedCharacters.add(c.folder_path);
			}
		}
	}

	function getCurrentAssignments(eventType: string): SoundPoolEntry[] {
		if (currentCharacter === null) {
			return [];
		}
		const charAssignments = characterAssignments.get(currentCharacter.folder_path);
		return charAssignments?.get(eventType) ?? [];
	}

	function getTierAssignedCount(tier: (typeof eventsByTier)[number]): number {
		return tier.events.filter((e) => getCurrentAssignments(e.eventType).length > 0).length;
	}

	function handleReMap() {
		if (currentCharacter === null) {
			return;
		}
		const charPath = currentCharacter.folder_path;
		const newAssignments = new SvelteMap<string, SoundPoolEntry[]>();
		let soundId = Date.now();

		for (const mapping of currentCharacter.proposed_mappings) {
			const sound: SoundPoolEntry = {
				id: `remap-${soundId++}`,
				fileName: mapping.sound_file,
				relativePath: mapping.sound_file,
				fullPath: `${charPath}/${mapping.sound_file}`,
				durationMs: null,
				assignedEventType: mapping.event_type,
			};
			const existing = newAssignments.get(mapping.event_type) ?? [];
			newAssignments.set(mapping.event_type, [...existing, sound]);
		}

		characterAssignments.set(charPath, newAssignments);
	}

	async function handleImport() {
		if (selectedCharacterList.length === 0) {
			return;
		}
		step = 'import';
		importing = true;

		try {
			const importCharacters = selectedCharacterList.map((char) => {
				const assignments: SaveSoundAssignment[] = [];
				const charAssignments = characterAssignments.get(char.folder_path);
				if (charAssignments !== undefined) {
					for (const [eventType, sounds] of charAssignments) {
						for (let i = 0; i < sounds.length; i++) {
							assignments.push({
								event_type: eventType,
								sound_file: sounds[i].fileName,
								label: null,
								sort_order: i,
							});
						}
					}
				}

				return {
					folder_path: char.folder_path,
					name: char.folder_name.toLowerCase().replace(/\s+/g, '-'),
					display_name: char.folder_name,
					language: characterLanguages.get(char.folder_path) ?? null,
					assignments,
				};
			});

			for (let i = 0; i < importCharacters.length; i++) {
				importCurrentName = importCharacters[i].display_name;
				importProgress = ((i + 1) / importCharacters.length) * 100;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			await characterPacks.bulkImport({ characters: importCharacters });
			onimported?.();
			open = false;
		} catch (err) {
			console.error('Bulk import failed:', err);
			step = 'review';
		} finally {
			importing = false;
		}
	}

	function resetWizard() {
		step = 'scan';
		scanResult = null;
		selectedCharacters.clear();
		selectedCharacterIndex = 0;
		expandedFactions.clear();
		characterLanguages.clear();
		characterAssignments.clear();
		importProgress = 0;
	}

	$effect(() => {
		if (open === false) {
			resetWizard();
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-5xl max-h-[85vh] flex flex-col p-0">
		<Dialog.Header class="flex-row items-center gap-3 border-b border-border px-4 py-3">
			<Dialog.Title class="text-lg">Bulk Import Characters</Dialog.Title>
			{#if scanResult}
				<Badge variant="info">
					{characters.length} characters · {scanResult.total_sounds} sounds
				</Badge>
			{/if}
			{#if step === 'review'}
				<Badge variant={selectedCharacterList.length > 0 ? 'success' : 'warning'}>
					{selectedCharacterList.length} selected
				</Badge>
			{/if}
		</Dialog.Header>

		<div class="min-h-0 flex-1 overflow-hidden">
			{#if step === 'scan'}
				<!-- Step 1: Folder Selection -->
				<div class="flex h-full items-center justify-center p-8">
					<div class="flex flex-col items-center gap-4 text-center">
						<FolderOpenIcon class="size-12 text-muted-foreground" />
						<div>
							<h3 class="text-lg font-medium">Select a folder to scan</h3>
							<p class="mt-1 text-sm text-muted-foreground">
								Choose a folder with structured subfolders containing sound files.
								Each subfolder becomes a character.
							</p>
						</div>
						<Button onclick={handleSelectFolder} disabled={scanning}>
							{scanning ? 'Scanning...' : 'Choose Folder'}
						</Button>
					</div>
				</div>
			{:else if step === 'review'}
				<!-- Step 2: Review & Map -->
				<div class="flex h-[60vh]">
					<!-- Left: Faction Tree -->
					<div class="w-[280px] shrink-0 overflow-y-auto border-r border-border p-2">
						<div class="mb-2 flex items-center gap-2 px-2 py-1">
							<Checkbox
								checked={selectedCharacters.size === characters.length}
								indeterminate={selectedCharacters.size > 0 &&
									selectedCharacters.size < characters.length}
								onCheckedChange={handleSelectAll}
							/>
							<span class="text-xs font-medium text-muted-foreground">Select All</span
							>
						</div>

						{#each factions as [faction, factionCharacters] (faction)}
							<div class="mb-1">
								<button
									type="button"
									class="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-2"
									onclick={() => handleToggleFaction(faction)}
									aria-expanded={expandedFactions.has(faction)}
								>
									{#if expandedFactions.has(faction)}
										<ChevronDownIcon class="size-3" />
									{:else}
										<ChevronRightIcon class="size-3" />
									{/if}
									{faction}
									<span class="ml-auto text-[10px]"
										>{factionCharacters.length}</span
									>
								</button>

								{#if expandedFactions.has(faction)}
									<div class="ml-4">
										{#each factionCharacters as char (char.folder_path)}
											{@const quality = getCharacterQuality(char)}
											{@const isSelected = selectedCharacters.has(
												char.folder_path,
											)}
											{@const isActive =
												currentCharacter?.folder_path === char.folder_path}
											<button
												type="button"
												class={cn(
													'flex w-full items-center gap-2 rounded px-2 py-1 text-xs transition-colors',
													isActive
														? 'bg-primary/10 text-primary'
														: 'hover:bg-surface-2',
													!isSelected && 'opacity-40',
												)}
												onclick={() => {
													const idx = selectedCharacterList.findIndex(
														(c) => c.folder_path === char.folder_path,
													);
													if (idx >= 0) {
														selectedCharacterIndex = idx;
													}
												}}
											>
												<Checkbox
													checked={isSelected}
													onCheckedChange={(checked) =>
														handleToggleCharacter(
															char.folder_path,
															checked === true,
														)}
												/>
												<div
													class={cn(
														'size-2 rounded-full',
														quality === 'ready' && 'bg-status-success',
														quality === 'partial' &&
															'bg-status-warning',
														quality === 'sparse' && 'bg-status-danger',
													)}
												></div>
												<span class="truncate">{char.folder_name}</span>
												<span
													class="ml-auto text-[10px] text-muted-foreground"
												>
													{char.sounds.length}
												</span>
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>

					<!-- Center: Event mappings for selected character -->
					<div class="flex-1 overflow-y-auto p-4">
						{#if currentCharacter}
							<div class="mb-4 flex items-center gap-3">
								<h3 class="text-sm font-semibold">
									{currentCharacter.folder_name}
								</h3>
								<Badge variant="mono" size="compact">
									{currentCharacter.sounds.length} sounds
								</Badge>
								<LanguageSelect
									value={characterLanguages.get(currentCharacter.folder_path) ??
										null}
									onchange={(v) => {
										characterLanguages.set(currentCharacter.folder_path, v);
									}}
								/>
								<Button
									variant="ghost"
									size="sm"
									class="ml-auto h-7"
									onclick={handleReMap}
								>
									<RefreshCwIcon class="size-3" />
									Re-map
								</Button>
							</div>

							<Accordion.Root type="multiple" bind:value={tierAccordionValue}>
								{#each eventsByTier as tierGroup (tierGroup.tier)}
									<TierSection
										tier={tierGroup.tier}
										label={tierGroup.label}
										assignedCount={getTierAssignedCount(tierGroup)}
										totalCount={tierGroup.events.length}
										value={tierGroup.tier}
									>
										{#each tierGroup.events as event (event.eventType)}
											<EventSlotCard
												eventType={event.eventType}
												label={event.label}
												description={event.description}
												tier={tierGroup.tier}
												sounds={getCurrentAssignments(event.eventType)}
												{playingSoundId}
												onplay={(id) => {
													playingSoundId =
														playingSoundId === id ? null : id;
												}}
											/>
										{/each}
									</TierSection>
								{/each}
							</Accordion.Root>
						{:else}
							<div
								class="flex h-full items-center justify-center text-sm text-muted-foreground"
							>
								Select a character from the tree to review mappings
							</div>
						{/if}
					</div>
				</div>
			{:else if step === 'import'}
				<!-- Step 3: Import Progress -->
				<div class="flex h-[60vh] items-center justify-center p-8">
					<div class="flex w-full max-w-sm flex-col items-center gap-4 text-center">
						{#if importing}
							<div
								class="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
							></div>
							<div>
								<h3 class="text-lg font-medium">Importing Characters</h3>
								<p class="mt-1 text-sm text-muted-foreground">
									{importCurrentName}
								</p>
							</div>
							<div class="w-full">
								<Progress value={importProgress} class="h-2" />
								<p class="mt-1 text-xs text-muted-foreground">
									{Math.round(importProgress)}%
								</p>
							</div>
						{:else}
							<CheckIcon class="size-12 text-status-success" />
							<h3 class="text-lg font-medium">Import Complete!</h3>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer class="border-t border-border px-4 py-3">
			{#if step === 'scan'}
				<Button
					variant="ghost"
					onclick={() => {
						open = false;
						onclose?.();
					}}
				>
					Cancel
				</Button>
			{:else if step === 'review'}
				<div class="flex w-full items-center justify-between">
					<div class="flex items-center gap-3 text-xs text-muted-foreground">
						<span class="flex items-center gap-1">
							<CheckIcon class="size-3 text-status-success" />
							{readyCount} ready
						</span>
						{#if selectedCharacterList.length - readyCount > 0}
							<span class="flex items-center gap-1">
								<AlertCircleIcon class="size-3 text-status-warning" />
								{selectedCharacterList.length - readyCount} incomplete
							</span>
						{/if}
					</div>
					<div class="flex gap-2">
						<Button
							variant="ghost"
							onclick={() => {
								step = 'scan';
							}}
						>
							Back
						</Button>
						<Button
							onclick={handleImport}
							disabled={selectedCharacterList.length === 0}
						>
							Import {selectedCharacterList.length} Character{selectedCharacterList.length !==
							1
								? 's'
								: ''}
						</Button>
					</div>
				</div>
			{:else}
				<Button
					onclick={() => {
						open = false;
						onclose?.();
					}}
				>
					Close
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import * as Accordion from '$lib/components/shadcn/accordion/index.js';
	import { WithTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { Progress } from '$lib/components/shadcn/progress/index.js';
	import {
		AvatarUpload,
		EventSlotCard,
		TierSection,
		SoundPoolPanel,
		LanguageSelect,
	} from '$lib/components/blocks/character/index.js';
	import {
		useCharacterPacks,
		getEventsByTier,
		type SoundPoolEntry,
		type SaveSoundAssignment,
	} from '$lib/modules/character-packs';
	import { SvelteMap } from 'svelte/reactivity';
	import { invoke } from '$lib/tauri.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SaveIcon from '@lucide/svelte/icons/save';

	const characterPacks = useCharacterPacks();

	const editPackId = $derived(page.url.searchParams.get('packId'));
	const isEditMode = $derived(editPackId !== null);

	let characterName = $state('');
	let displayName = $state('');
	let language = $state<string | null>(null);
	let avatarUrl = $state<string | null>(null);
	let packId = $state<string | null>(null);
	let soundPool = $state<SoundPoolEntry[]>([]);
	const eventAssignments = new SvelteMap<string, SoundPoolEntry[]>();
	let playingSoundId = $state<string | null>(null);
	let audioElement = $state<HTMLAudioElement | null>(null);
	let saving = $state(false);
	let accordionValue = $state<string[]>(['critical', 'important']);
	let nextSoundId = $state(1);

	const eventsByTier = getEventsByTier();

	const totalEvents = $derived(eventsByTier.reduce((sum, t) => sum + t.events.length, 0));
	const assignedEvents = $derived(
		eventsByTier.reduce((sum, t) => {
			return (
				sum +
				t.events.filter((e) => {
					const sounds = eventAssignments.get(e.eventType);
					return sounds !== undefined && sounds.length > 0;
				}).length
			);
		}, 0),
	);

	const criticalMissing = $derived.by(() => {
		const criticalTier = eventsByTier.find((t) => t.tier === 'critical');
		if (criticalTier === undefined) {
			return [];
		}
		return criticalTier.events.filter((e) => {
			const sounds = eventAssignments.get(e.eventType);
			return sounds === undefined || sounds.length === 0;
		});
	});

	const canSave = $derived(
		characterName.trim().length > 0 && criticalMissing.length === 0 && saving === false,
	);

	const saveTooltip = $derived.by(() => {
		if (characterName.trim().length === 0) {
			return 'Enter a character name';
		}
		if (criticalMissing.length === 1) {
			return `Assign a sound to "${criticalMissing[0].label}" to enable save`;
		}
		if (criticalMissing.length > 1) {
			return `${criticalMissing.length} critical slots need a sound`;
		}
		return '';
	});

	function getSoundsForEvent(eventType: string): SoundPoolEntry[] {
		return eventAssignments.get(eventType) ?? [];
	}

	function getTierAssignedCount(tier: (typeof eventsByTier)[number]): number {
		return tier.events.filter((e) => getSoundsForEvent(e.eventType).length > 0).length;
	}

	function handleDrop(eventType: string, soundId: string) {
		const sound = soundPool.find((s) => s.id === soundId);
		if (sound === undefined) {
			return;
		}

		const existing = eventAssignments.get(eventType) ?? [];
		if (existing.some((s) => s.id === soundId)) {
			return;
		}

		const updatedSound = { ...sound, assignedEventType: eventType };
		eventAssignments.set(eventType, [...existing, updatedSound]);

		soundPool = soundPool.map((s) =>
			s.id === soundId ? { ...s, assignedEventType: eventType } : s,
		);
	}

	function handleRemoveSound(eventType: string, soundId: string) {
		const existing = eventAssignments.get(eventType) ?? [];
		eventAssignments.set(
			eventType,
			existing.filter((s) => s.id !== soundId),
		);

		soundPool = soundPool.map((s) =>
			s.id === soundId ? { ...s, assignedEventType: null } : s,
		);
	}

	function handlePlaySound(soundId: string) {
		if (playingSoundId === soundId) {
			audioElement?.pause();
			playingSoundId = null;
			return;
		}

		const sound = soundPool.find((s) => s.id === soundId);
		if (sound === undefined) {
			return;
		}

		if (audioElement !== null) {
			audioElement.pause();
		}

		audioElement = new Audio(sound.fullPath);
		audioElement.onended = () => {
			playingSoundId = null;
		};
		void audioElement.play();
		playingSoundId = soundId;
	}

	async function handleImportFolder() {
		try {
			const folderPath = await invoke<string | null>('pick_folder');
			if (folderPath === null || packId === null) {
				return;
			}
			const name =
				characterName.trim().length > 0 ? characterName.trim() : `character-${Date.now()}`;
			const imported = await characterPacks.importSoundFiles(packId, name, [folderPath]);
			const newEntries: SoundPoolEntry[] = imported.map((s) => ({
				id: `sound-${nextSoundId++}`,
				fileName: s.file_name,
				relativePath: s.relative_path,
				fullPath: s.full_path,
				durationMs: s.duration_ms,
				assignedEventType: null,
			}));
			soundPool = [...soundPool, ...newEntries];
		} catch (err) {
			console.error('Failed to import sounds:', err);
		}
	}

	async function handleAvatarUpload(imageData: number[]) {
		if (packId === null) {
			return;
		}
		try {
			avatarUrl = await characterPacks.uploadAvatar(packId, imageData);
		} catch (err) {
			console.error('Failed to upload avatar:', err);
		}
	}

	function handleClearAll() {
		soundPool = soundPool.map((s) => ({ ...s, assignedEventType: null }));
		eventAssignments.clear();
	}

	function buildAssignmentsFromMap(): SaveSoundAssignment[] {
		const result: SaveSoundAssignment[] = [];
		for (const [eventType, sounds] of eventAssignments) {
			for (let i = 0; i < sounds.length; i++) {
				result.push({
					event_type: eventType,
					sound_file: sounds[i].fileName,
					label: null,
					sort_order: i,
				});
			}
		}
		return result;
	}

	function resolveDisplayName(): string {
		return displayName.trim().length > 0 ? displayName.trim() : characterName.trim();
	}

	async function handleSave() {
		if (canSave === false || packId === null) {
			return;
		}

		saving = true;
		try {
			if (isEditMode) {
				await characterPacks.updatePack({
					id: packId,
					display_name: resolveDisplayName(),
					language,
				});
			}

			await characterPacks.saveSounds(packId, buildAssignmentsFromMap());
			await goto(resolve('/settings'));
		} catch (err) {
			console.error('Failed to save character pack:', err);
		} finally {
			saving = false;
		}
	}

	onMount(async () => {
		if (editPackId !== null) {
			const data = await characterPacks.getPackWithSounds(editPackId);
			if (data !== null) {
				packId = data.id;
				characterName = data.name;
				displayName = data.display_name;
				language = data.language;
				avatarUrl = data.avatar_path;

				const soundEntries: SoundPoolEntry[] = data.sounds.map((s, i) => ({
					id: `sound-${i + 1}`,
					fileName: s.sound_file,
					relativePath: s.sound_file,
					fullPath: s.sound_file,
					durationMs: null,
					assignedEventType: s.event_type,
				}));
				nextSoundId = soundEntries.length + 1;
				soundPool = soundEntries;

				eventAssignments.clear();
				for (const entry of soundEntries) {
					if (entry.assignedEventType !== null) {
						const existing = eventAssignments.get(entry.assignedEventType) ?? [];
						eventAssignments.set(entry.assignedEventType, [...existing, entry]);
					}
				}
			}
		} else {
			try {
				const created = await characterPacks.createPack({
					name: `character-${Date.now()}`,
					display_name: 'New Character',
				});
				packId = created.id;
			} catch (err) {
				console.error('Failed to create character pack:', err);
			}
		}
	});
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<header class="flex items-center gap-3 border-b border-border px-4 py-3">
		<Button
			variant="ghost"
			size="sm"
			class="size-8 p-0"
			onclick={() => void goto(resolve('/settings'))}
		>
			<ArrowLeftIcon class="size-4" />
		</Button>

		<h1 class="text-lg font-semibold">
			{isEditMode ? 'Edit Character' : 'Create Character'}
		</h1>

		{#if criticalMissing.length > 0}
			<Badge variant="danger" dot="pulsing">
				{criticalMissing.length} critical slot{criticalMissing.length !== 1 ? 's' : ''} empty
			</Badge>
		{/if}

		<div class="ml-auto flex items-center gap-2">
			<Button variant="ghost" onclick={() => void goto(resolve('/settings'))}>Cancel</Button>
			{#if canSave}
				<Button onclick={handleSave} disabled={saving}>
					<SaveIcon class="size-4" />
					{saving ? 'Saving...' : 'Save'}
				</Button>
			{:else}
				<WithTooltip text={saveTooltip}>
					{#snippet asChild(props)}
						<div {...props}>
							<Button disabled>
								<SaveIcon class="size-4" />
								Save
							</Button>
						</div>
					{/snippet}
				</WithTooltip>
			{/if}
		</div>
	</header>

	<!-- Body: two-panel split -->
	<div class="flex min-h-0 flex-1">
		<!-- Left: Identity + Events -->
		<div class="flex-1 overflow-y-auto p-4">
			<!-- Identity section -->
			<div
				class="mb-6 flex items-start gap-4 rounded-lg border border-border bg-[color-mix(in_oklch,var(--surface)_50%,var(--background))] p-4"
			>
				<AvatarUpload {avatarUrl} onupload={handleAvatarUpload} />

				<div class="flex flex-1 flex-col gap-3">
					<div class="flex gap-3">
						<div class="flex-1">
							<label
								for="character-name"
								class="mb-1 block text-xs font-medium text-muted-foreground"
							>
								Character Name
							</label>
							<Input
								id="character-name"
								bind:value={characterName}
								placeholder="e.g. Peon, Peasant, Knight..."
								class="h-9"
								disabled={isEditMode}
							/>
						</div>
						<div class="flex-1">
							<label
								for="display-name"
								class="mb-1 block text-xs font-medium text-muted-foreground"
							>
								Display Name
							</label>
							<Input
								id="display-name"
								bind:value={displayName}
								placeholder="Shown in UI"
								class="h-9"
							/>
						</div>
					</div>
					<div>
						<span class="mb-1 block text-xs font-medium text-muted-foreground"
							>Language</span
						>
						<LanguageSelect value={language} onchange={(v) => (language = v)} />
					</div>
				</div>
			</div>

			<!-- Event assignment tiers -->
			<Accordion.Root type="multiple" bind:value={accordionValue}>
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
								sounds={getSoundsForEvent(event.eventType)}
								{playingSoundId}
								ondrop={handleDrop}
								onremove={handleRemoveSound}
								onplay={handlePlaySound}
							/>
						{/each}
					</TierSection>
				{/each}
			</Accordion.Root>
		</div>

		<!-- Right: Sound Pool -->
		<div class="w-80 shrink-0">
			<SoundPoolPanel
				sounds={soundPool}
				{playingSoundId}
				onimport={handleImportFolder}
				onplay={handlePlaySound}
				onclearall={handleClearAll}
				class="h-full"
			/>
		</div>
	</div>

	<!-- Footer -->
	<footer class="flex items-center gap-4 border-t border-border px-4 py-2">
		<div class="flex-1">
			<div class="mb-1 flex items-center justify-between text-xs text-muted-foreground">
				<span>{assignedEvents} / {totalEvents} events assigned</span>
				<span>{Math.round((assignedEvents / totalEvents) * 100)}%</span>
			</div>
			<Progress value={(assignedEvents / totalEvents) * 100} class="h-1.5" />
		</div>
	</footer>
</div>

import { createContext } from 'svelte';
import { invoke } from '$lib/tauri.js';
import type {
	CharacterPack,
	CharacterPackWithSounds,
	FolderScanResult,
	ScannedSound,
	NotificationEventType,
	ImportanceTier,
} from '$lib/types/generated';

// ─── Event metadata ──────────────────────────────────────────────────────

export interface EventTypeInfo {
	eventType: NotificationEventType;
	label: string;
	description: string;
	tier: ImportanceTier;
}

const CRITICAL_EVENTS: NotificationEventType[] = ['session.needs-input', 'session.end'];

export const EVENT_TYPE_INFOS: EventTypeInfo[] = [
	{
		eventType: 'session.needs-input',
		label: 'Needs Input',
		description: 'Agent is waiting for user input',
		tier: 'critical',
	},
	{
		eventType: 'session.end',
		label: 'Session End',
		description: 'Agent session has finished',
		tier: 'critical',
	},
	{
		eventType: 'session.error',
		label: 'Error',
		description: 'Agent encountered an error',
		tier: 'important',
	},
	{
		eventType: 'merge.conflict',
		label: 'Merge Conflict',
		description: 'Git merge conflict detected',
		tier: 'important',
	},
	{
		eventType: 'resource.limit',
		label: 'Resource Limit',
		description: 'API rate limit or quota reached',
		tier: 'important',
	},
	{
		eventType: 'pr.ready',
		label: 'PR Ready',
		description: 'Pull request is ready for review',
		tier: 'important',
	},
	{
		eventType: 'session.start',
		label: 'Session Start',
		description: 'Agent session has started',
		tier: 'normal',
	},
	{
		eventType: 'task.complete',
		label: 'Task Complete',
		description: 'A task has been completed',
		tier: 'normal',
	},
	{
		eventType: 'task.acknowledge',
		label: 'Acknowledge',
		description: 'Agent acknowledged a command',
		tier: 'normal',
	},
	{
		eventType: 'pr.merged',
		label: 'PR Merged',
		description: 'Pull request was merged',
		tier: 'normal',
	},
	{
		eventType: 'pr.review-requested',
		label: 'Review Requested',
		description: 'Review requested on a pull request',
		tier: 'normal',
	},
	{
		eventType: 'branch.behind-base',
		label: 'Branch Behind',
		description: 'Branch is behind the base branch',
		tier: 'normal',
	},
	{
		eventType: 'github.issue-assigned',
		label: 'Issue Assigned',
		description: 'GitHub issue was assigned to you',
		tier: 'normal',
	},
	{
		eventType: 'github.trigger-received',
		label: 'Trigger Received',
		description: 'External trigger was received',
		tier: 'normal',
	},
	{
		eventType: 'achievement.unlocked',
		label: 'Achievement',
		description: 'An achievement was unlocked',
		tier: 'normal',
	},
];

export function getEventsByTier(): {
	tier: ImportanceTier;
	label: string;
	events: EventTypeInfo[];
}[] {
	return [
		{
			tier: 'critical',
			label: 'Critical',
			events: EVENT_TYPE_INFOS.filter((e) => e.tier === 'critical'),
		},
		{
			tier: 'important',
			label: 'Important',
			events: EVENT_TYPE_INFOS.filter((e) => e.tier === 'important'),
		},
		{
			tier: 'normal',
			label: 'Normal',
			events: EVENT_TYPE_INFOS.filter((e) => e.tier === 'normal'),
		},
	];
}

// ─── Sound assignment types ──────────────────────────────────────────────

export interface SoundPoolEntry {
	id: string;
	fileName: string;
	relativePath: string;
	fullPath: string;
	durationMs: number | null;
	assignedEventType: string | null;
}

export interface EventSoundAssignment {
	eventType: NotificationEventType;
	sounds: SoundPoolEntry[];
}

export interface SaveSoundAssignment {
	event_type: string;
	sound_file: string;
	label: string | null;
	sort_order: number;
}

// ─── Language options ────────────────────────────────────────────────────

export const LANGUAGE_OPTIONS = [
	{ value: 'en', label: 'English', flag: '🇺🇸' },
	{ value: 'cz', label: 'Czech', flag: '🇨🇿' },
	{ value: 'de', label: 'German', flag: '🇩🇪' },
	{ value: 'fr', label: 'French', flag: '🇫🇷' },
	{ value: 'es', label: 'Spanish', flag: '🇪🇸' },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]['value'];

export function getLanguageFlag(languageCode: string | null): string | null {
	if (languageCode === null || languageCode === undefined) {
		return null;
	}
	return LANGUAGE_OPTIONS.find((l) => l.value === languageCode)?.flag ?? null;
}

// ─── Context ─────────────────────────────────────────────────────────────

type CharacterPacksContext = ReturnType<typeof createCharacterPacksContext>;

const [useCharacterPacks, setCharacterPacksInternal] = createContext<CharacterPacksContext>();
export { useCharacterPacks };

export function setCharacterPacksContext() {
	const ctx = createCharacterPacksContext();
	setCharacterPacksInternal(ctx);
	return ctx;
}

// ─── Factory ─────────────────────────────────────────────────────────────

function createCharacterPacksContext() {
	let packs = $state<CharacterPack[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const enabledPacks = $derived(packs.filter((p) => p.is_enabled));
	const userPacks = $derived(packs.filter((p) => !p.is_bundled));
	const bundledPacks = $derived(packs.filter((p) => p.is_bundled));

	return {
		get packs() {
			return packs;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get enabledPacks() {
			return enabledPacks;
		},
		get userPacks() {
			return userPacks;
		},
		get bundledPacks() {
			return bundledPacks;
		},

		async loadPacks() {
			try {
				loading = true;
				error = null;
				packs = await invoke<CharacterPack[]>('get_character_packs');
			} catch (err) {
				error = String(err);
				console.error('Failed to load character packs:', err);
			} finally {
				loading = false;
			}
		},

		async getPackWithSounds(packId: string): Promise<CharacterPackWithSounds | null> {
			try {
				return await invoke<CharacterPackWithSounds>('get_character_pack_with_sounds', {
					packId,
				});
			} catch (err) {
				console.error('Failed to load character pack:', err);
				return null;
			}
		},

		async createPack(request: {
			name: string;
			display_name: string;
			language?: string | null;
		}): Promise<CharacterPack> {
			const pack = await invoke<CharacterPack>('create_character_pack', { request });
			packs = [...packs, pack];
			return pack;
		},

		async updatePack(request: {
			id: string;
			display_name?: string;
			language?: string | null;
		}): Promise<CharacterPack> {
			const updated = await invoke<CharacterPack>('update_character_pack', { request });
			packs = packs.map((p) => (p.id === updated.id ? updated : p));
			return updated;
		},

		async deletePack(packId: string): Promise<void> {
			await invoke('delete_character_pack', { packId });
			packs = packs.filter((p) => p.id !== packId);
		},

		async toggleEnabled(packId: string, enabled: boolean): Promise<void> {
			await invoke('toggle_character_pack_enabled', { packId, enabled });
			packs = packs.map((p) => (p.id === packId ? { ...p, is_enabled: enabled } : p));
		},

		async saveSounds(
			characterPackId: string,
			assignments: SaveSoundAssignment[],
		): Promise<void> {
			await invoke('save_character_pack_sounds', {
				request: { character_pack_id: characterPackId, assignments },
			});
			const criticalFilled = CRITICAL_EVENTS.every((event) =>
				assignments.some((a) => a.event_type === event),
			);
			packs = packs.map((p) =>
				p.id === characterPackId
					? {
							...p,
							is_complete: criticalFilled,
							is_enabled: criticalFilled ? p.is_enabled : false,
						}
					: p,
			);
		},

		async uploadAvatar(packId: string, imageData: number[]): Promise<string> {
			const avatarPath = await invoke<string>('upload_character_avatar', {
				packId,
				imageData,
			});
			packs = packs.map((p) => (p.id === packId ? { ...p, avatar_path: avatarPath } : p));
			return avatarPath;
		},

		async scanFolder(folderPath: string): Promise<FolderScanResult> {
			return invoke<FolderScanResult>('scan_folder_for_characters', { folderPath });
		},

		async bulkImport(request: {
			characters: {
				folder_path: string;
				name: string;
				display_name: string;
				language?: string | null;
				assignments: SaveSoundAssignment[];
			}[];
		}): Promise<CharacterPack[]> {
			const created = await invoke<CharacterPack[]>('bulk_import_characters', { request });
			packs = [...packs, ...created];
			return created;
		},

		async importSoundFiles(
			packId: string,
			packName: string,
			sourcePaths: string[],
		): Promise<ScannedSound[]> {
			return invoke<ScannedSound[]>('import_sound_files', {
				packId,
				packName,
				sourcePaths,
			});
		},

		getRandomEnabledPack(): CharacterPack | null {
			if (enabledPacks.length === 0) {
				return null;
			}
			return enabledPacks[Math.floor(Math.random() * enabledPacks.length)];
		},
	};
}

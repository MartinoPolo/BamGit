import { createContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { invoke, isTauri } from '$lib/tauri.js';
import type {
	NotificationConfig as GeneratedNotificationConfig,
	NotificationEventType,
	ImportanceTier,
	SoundPackInfo,
	SoundVolumeOverride,
} from '$lib/types/generated';

// ─── Narrowed types ───────────────────────────────────────────────────────

/** NotificationConfig with event_type narrowed from string to NotificationEventType. */
/** @public */
export interface NotificationConfig extends Omit<GeneratedNotificationConfig, 'event_type'> {
	event_type: NotificationEventType;
}

// ─── Frontend-only request types ──────────────────────────────────────────

/** @public */
export interface UpdateNotificationConfigRequest {
	event_type: NotificationEventType;
	sound_enabled?: boolean;
	sound_file?: string | null;
	toast_enabled?: boolean;
	window_flash_enabled?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────

const CRITICAL_EVENTS: NotificationEventType[] = ['session.needs-input', 'session.end'];
const IMPORTANT_EVENTS: NotificationEventType[] = [
	'session.error',
	'merge.conflict',
	'resource.limit',
	'pr.ready',
];

/** Tailwind color classes for notification indicator dots. null = no dot shown. */
export const NOTIFICATION_DOT_COLORS: Partial<Record<NotificationEventType, string | null>> = {
	'session.needs-input': 'bg-amber-400',
	'session.error': 'bg-red-400',
	'session.end': 'bg-green-400',
	'merge.conflict': 'bg-orange-400',
	'resource.limit': 'bg-yellow-400',
	'pr.ready': 'bg-blue-400',
};

/** Human-readable labels for importance tiers. */
/** @public */
export const IMPORTANCE_TIER_LABELS: Record<ImportanceTier, string> = {
	critical: 'Critical',
	important: 'Important',
	normal: 'Normal',
};

/** Tier ordering for display. */
/** @public */
export const IMPORTANCE_TIER_ORDER: ImportanceTier[] = ['critical', 'important', 'normal'];

/** @public */
export function getImportanceTier(eventType: NotificationEventType): ImportanceTier {
	if ((CRITICAL_EVENTS as string[]).includes(eventType)) {
		return 'critical';
	}
	if ((IMPORTANT_EVENTS as string[]).includes(eventType)) {
		return 'important';
	}
	return 'normal';
}

/** Group configs by importance tier in display order. */
/** @public */
export function groupConfigsByTier(
	configs: NotificationConfig[],
): { tier: ImportanceTier; label: string; configs: NotificationConfig[] }[] {
	return IMPORTANCE_TIER_ORDER.map((tier) => ({
		tier,
		label: IMPORTANCE_TIER_LABELS[tier],
		configs: configs.filter((c) => c.importance_tier === tier),
	})).filter((group) => group.configs.length > 0);
}

// ─── Context ──────────────────────────────────────────────────────────────

type NotificationsContext = ReturnType<typeof createNotificationsContext>;

const [useNotifications, setNotificationsInternal] = createContext<NotificationsContext>();
export { useNotifications };

export function setNotificationsContext() {
	const ctx = createNotificationsContext();
	setNotificationsInternal(ctx);
	return ctx;
}

// ─── Factory ──────────────────────────────────────────────────────────────

function createNotificationsContext() {
	let configs = $state<NotificationConfig[]>([]);
	const pendingNotifications = new SvelteMap<string, NotificationEventType>();
	let loading = $state(false);
	let error = $state<string | null>(null);
	let globalVolume = $state(0.8);
	let soundPacks = $state<SoundPackInfo[]>([]);
	let volumeOverrides = $state<SoundVolumeOverride[]>([]);

	return {
		get configs() {
			return configs;
		},
		get pendingNotifications() {
			return pendingNotifications;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get globalVolume() {
			return globalVolume;
		},
		get soundPacks() {
			return soundPacks;
		},
		get volumeOverrides() {
			return volumeOverrides;
		},

		async loadConfigs() {
			if (!isTauri()) {
				return;
			}
			try {
				loading = true;
				error = null;
				configs = (await invoke<GeneratedNotificationConfig[]>(
					'get_notification_configs',
				)) as NotificationConfig[];
			} catch (err) {
				error = String(err);
				console.error('Failed to load notification configs:', err);
			} finally {
				loading = false;
			}
		},

		async loadGlobalVolume() {
			if (!isTauri()) {
				return;
			}
			try {
				globalVolume = await invoke<number>('get_notification_volume');
			} catch (err) {
				console.error('Failed to load global volume:', err);
			}
		},

		async setGlobalVolume(volume: number) {
			globalVolume = volume;
			if (!isTauri()) {
				return;
			}
			try {
				await invoke('set_notification_volume', { volume });
			} catch (err) {
				console.error('Failed to set global volume:', err);
			}
		},

		async loadSoundPacks() {
			if (!isTauri()) {
				return;
			}
			try {
				soundPacks = await invoke<SoundPackInfo[]>('list_sound_packs');
			} catch (err) {
				console.error('Failed to load sound packs:', err);
			}
		},

		async loadVolumeOverrides() {
			if (!isTauri()) {
				return;
			}
			try {
				volumeOverrides = await invoke<SoundVolumeOverride[]>(
					'get_all_sound_volume_overrides',
				);
			} catch (err) {
				console.error('Failed to load volume overrides:', err);
			}
		},

		async setSoundVolumeOverride(
			eventType: NotificationEventType,
			soundFile: string,
			volume: number,
		) {
			if (!isTauri()) {
				return;
			}
			try {
				await invoke('set_sound_volume_override', {
					eventType,
					soundFile,
					volume,
				});
				volumeOverrides = volumeOverrides.map((o) =>
					o.event_type === eventType && o.sound_file === soundFile ? { ...o, volume } : o,
				);
				if (
					!volumeOverrides.some(
						(o) => o.event_type === eventType && o.sound_file === soundFile,
					)
				) {
					volumeOverrides = [
						...volumeOverrides,
						{ event_type: eventType, sound_file: soundFile, volume },
					];
				}
			} catch (err) {
				console.error('Failed to set volume override:', err);
			}
		},

		getVolumeOverride(eventType: NotificationEventType, soundFile: string): number {
			const override = volumeOverrides.find(
				(o) => o.event_type === eventType && o.sound_file === soundFile,
			);
			return override?.volume ?? 1.0;
		},

		updateConfig(updated: NotificationConfig) {
			configs = configs.map((config) =>
				config.event_type === updated.event_type ? updated : config,
			);
		},

		addPending(sessionId: string, eventType: NotificationEventType) {
			pendingNotifications.set(sessionId, eventType);
		},

		clearPending(sessionId: string) {
			pendingNotifications.delete(sessionId);
		},

		hasPending(sessionId: string): boolean {
			return pendingNotifications.has(sessionId);
		},

		getPendingType(sessionId: string): NotificationEventType | undefined {
			return pendingNotifications.get(sessionId);
		},

		async updateNotificationConfig(
			request: UpdateNotificationConfigRequest,
		): Promise<NotificationConfig> {
			return invoke('update_notification_config', {
				request,
			}) as Promise<NotificationConfig>;
		},

		async testNotificationSound(eventType: string): Promise<void> {
			return invoke('test_notification_sound', { eventType });
		},

		async installSoundPack(sourcePath: string): Promise<SoundPackInfo> {
			const pack = await invoke<SoundPackInfo>('install_sound_pack', { sourcePath });
			soundPacks = [...soundPacks, pack];
			return pack;
		},

		async removeSoundPack(packName: string): Promise<void> {
			await invoke('remove_sound_pack', { packName });
			soundPacks = soundPacks.filter((p) => p.name !== packName);
		},
	};
}

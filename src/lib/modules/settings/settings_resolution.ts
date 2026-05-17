import {
	SETTING_DEFAULTS,
	FOUC_MIRROR_KEYS,
	FOUC_STORAGE_PREFIX,
	SETTING_KEYS,
	type SettingKey,
} from './types.js';

/** @public */
export interface ResolvedSetting {
	readonly value: string;
	readonly isOverridden: boolean;
}

export function resolveSettingCascade(
	key: SettingKey,
	userValue: string | null,
	workspaceValue: string | null,
): ResolvedSetting {
	const defaultValue = SETTING_DEFAULTS[key];

	if (workspaceValue !== null) {
		return { value: workspaceValue, isOverridden: true };
	}
	if (userValue !== null) {
		return { value: userValue, isOverridden: false };
	}
	return { value: defaultValue, isOverridden: false };
}

export function mirrorToLocalStorage(key: SettingKey, value: string): void {
	if (!FOUC_MIRROR_KEYS.includes(key)) {
		return;
	}
	const storageKey = FOUC_STORAGE_PREFIX + SETTING_KEYS[key];
	try {
		localStorage.setItem(storageKey, value);
	} catch {
		// QuotaExceededError — in-memory value still valid
	}
}

export function readFoucMirror(key: SettingKey): string | null {
	const storageKey = FOUC_STORAGE_PREFIX + SETTING_KEYS[key];
	try {
		return localStorage.getItem(storageKey);
	} catch {
		return null;
	}
}

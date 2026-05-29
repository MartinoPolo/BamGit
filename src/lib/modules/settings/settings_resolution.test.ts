import { describe, it, expect } from 'vitest';
import { resolveSettingCascade } from './settings_resolution.js';
import {
	SETTING_KEYS,
	SETTING_DEFAULTS,
	FOUC_MIRROR_KEYS,
	WORKSPACE_OVERRIDABLE_KEYS,
	type SettingKey,
} from './types.js';

describe('resolveSettingCascade', () => {
	it('returns workspace value over user value', () => {
		const result = resolveSettingCascade('themeMode', 'light', 'dark');
		expect(result.value).toBe('dark');
		expect(result.isOverridden).toBe(true);
	});

	it('falls back to user value when no workspace override', () => {
		const result = resolveSettingCascade('themeMode', 'light', null);
		expect(result.value).toBe('light');
		expect(result.isOverridden).toBe(false);
	});

	it('falls back to default when no values set', () => {
		const result = resolveSettingCascade('themeMode', null, null);
		expect(result.value).toBe('system');
		expect(result.isOverridden).toBe(false);
	});

	it('every setting key has a default value', () => {
		for (const key of Object.keys(SETTING_KEYS) as SettingKey[]) {
			const result = resolveSettingCascade(key, null, null);
			expect(result.value).toBeDefined();
			expect(result.value).toBe(SETTING_DEFAULTS[key]);
		}
	});
});

describe('FOUC_MIRROR_KEYS', () => {
	it('are valid setting keys', () => {
		for (const key of FOUC_MIRROR_KEYS) {
			expect(key in SETTING_KEYS).toBe(true);
		}
	});
});

describe('WORKSPACE_OVERRIDABLE_KEYS', () => {
	it('are valid setting keys', () => {
		for (const key of WORKSPACE_OVERRIDABLE_KEYS) {
			expect(key in SETTING_KEYS).toBe(true);
		}
	});

	it('includes chartColorTheme for per-workspace color theme override', () => {
		expect(WORKSPACE_OVERRIDABLE_KEYS).toContain('chartColorTheme');
	});
});

describe('SETTING_KEYS', () => {
	it('maps to unique DB keys', () => {
		const dbKeys = Object.values(SETTING_KEYS);
		const unique = new Set(dbKeys);
		expect(unique.size).toBe(dbKeys.length);
	});
});

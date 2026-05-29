import { describe, it, expect } from 'vitest';
import { formatImportToastMessage, isImportPrompted } from './import_helpers.js';
import type { ImportSummary } from '$lib/types/generated/index.js';

describe('formatImportToastMessage', () => {
	it('formats message with sessions, providers, and skipped count', () => {
		const summary: ImportSummary = {
			providers: [
				{ provider: 'claude-code', sessions_imported: 142, sessions_skipped: 0 },
				{ provider: 'cursor', sessions_imported: 89, sessions_skipped: 3 },
				{ provider: 'codex', sessions_imported: 16, sessions_skipped: 0 },
			],
			total_sessions: 247,
			total_skipped: 3,
		};
		const result = formatImportToastMessage(summary);
		expect(result).toBe('Imported 247 sessions from 3 providers (3 skipped as duplicates)');
	});

	it('omits skipped clause when total_skipped is zero', () => {
		const summary: ImportSummary = {
			providers: [{ provider: 'claude-code', sessions_imported: 10, sessions_skipped: 0 }],
			total_sessions: 10,
			total_skipped: 0,
		};
		const result = formatImportToastMessage(summary);
		expect(result).toBe('Imported 10 sessions from 1 provider');
	});

	it('uses singular "provider" when only one provider', () => {
		const summary: ImportSummary = {
			providers: [{ provider: 'cursor', sessions_imported: 5, sessions_skipped: 1 }],
			total_sessions: 5,
			total_skipped: 1,
		};
		const result = formatImportToastMessage(summary);
		expect(result).toBe('Imported 5 sessions from 1 provider (1 skipped as duplicates)');
	});

	it('handles zero total sessions', () => {
		const summary: ImportSummary = {
			providers: [],
			total_sessions: 0,
			total_skipped: 0,
		};
		const result = formatImportToastMessage(summary);
		expect(result).toBe('Imported 0 sessions from 0 providers');
	});
});

describe('isImportPrompted', () => {
	it('returns true when setting value is "true"', () => {
		expect(isImportPrompted({ key: 'usage_import_prompted', value: 'true' })).toBe(true);
	});

	it('returns false when setting value is not "true"', () => {
		expect(isImportPrompted({ key: 'usage_import_prompted', value: 'false' })).toBe(false);
	});

	it('returns false when setting is null', () => {
		expect(isImportPrompted(null)).toBe(false);
	});
});

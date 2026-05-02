import { describe, it, expect } from 'vitest';
import { parseRawRequirements, serializeRawRequirements, formatTimestamp } from './parser.js';

// ─── parseRawRequirements ────────────────────────────────────────────────────

describe('parseRawRequirements', () => {
	it('returns an empty array for an empty string', () => {
		expect(parseRawRequirements('')).toEqual([]);
	});

	it('parses a single note with timestamp header', () => {
		const input =
			'## 2026-05-01 14:30\nBuild a notification sound pack browser with preview playback\n';
		expect(parseRawRequirements(input)).toEqual([
			{
				timestamp: '2026-05-01 14:30',
				content: 'Build a notification sound pack browser with preview playback',
				processed: false,
			},
		]);
	});

	it('parses multiple notes separated by --- delimiters', () => {
		const input = '## 2026-05-01 14:30\nFirst note\n---\n## 2026-05-01 13:15\nSecond note\n';
		expect(parseRawRequirements(input)).toEqual([
			{ timestamp: '2026-05-01 14:30', content: 'First note', processed: false },
			{ timestamp: '2026-05-01 13:15', content: 'Second note', processed: false },
		]);
	});

	it('parses multi-line content within a note', () => {
		const input = '## 2026-05-01 14:30\nLine one\nLine two\nLine three\n';
		expect(parseRawRequirements(input)).toEqual([
			{
				timestamp: '2026-05-01 14:30',
				content: 'Line one\nLine two\nLine three',
				processed: false,
			},
		]);
	});

	it('handles processed marker [processed] after timestamp', () => {
		const input = '## 2026-05-01 14:30 [processed]\nA processed note\n';
		expect(parseRawRequirements(input)).toEqual([
			{ timestamp: '2026-05-01 14:30', content: 'A processed note', processed: true },
		]);
	});

	it('returns an empty array for whitespace-only or malformed input', () => {
		expect(parseRawRequirements('   \n\n  ')).toEqual([]);
	});
});

// ─── serializeRawRequirements ────────────────────────────────────────────────

describe('serializeRawRequirements', () => {
	it('returns an empty string for an empty array', () => {
		expect(serializeRawRequirements([])).toBe('');
	});

	it('serializes a single note into correct markdown', () => {
		const input = [{ timestamp: '2026-05-01 14:30', content: 'Test note', processed: false }];
		expect(serializeRawRequirements(input)).toBe('## 2026-05-01 14:30\nTest note\n');
	});

	it('serializes multiple notes separated by ---', () => {
		const input = [
			{ timestamp: '2026-05-01 14:30', content: 'First', processed: false },
			{ timestamp: '2026-05-01 13:15', content: 'Second', processed: false },
		];
		expect(serializeRawRequirements(input)).toBe(
			'## 2026-05-01 14:30\nFirst\n---\n## 2026-05-01 13:15\nSecond\n',
		);
	});

	it('includes [processed] marker for processed notes', () => {
		const input = [{ timestamp: '2026-05-01 14:30', content: 'Done note', processed: true }];
		expect(serializeRawRequirements(input)).toBe(
			'## 2026-05-01 14:30 [processed]\nDone note\n',
		);
	});
});

// ─── round-trip ──────────────────────────────────────────────────────────────

describe('round-trip', () => {
	it('preserves content when parsing then serializing', () => {
		const input = '## 2026-05-01 14:30\nFirst note\n---\n## 2026-05-01 13:15\nSecond note\n';
		expect(serializeRawRequirements(parseRawRequirements(input))).toBe(input);
	});
});

// ─── formatTimestamp ─────────────────────────────────────────────────────────

describe('formatTimestamp', () => {
	it('produces a string matching YYYY-MM-DD HH:mm format', () => {
		expect(formatTimestamp()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
	});

	it('formats a specific date correctly', () => {
		const date = new Date(2026, 0, 5, 9, 3);
		expect(formatTimestamp(date)).toBe('2026-01-05 09:03');
	});
});

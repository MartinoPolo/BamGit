import { describe, it, expect } from 'vitest';
import {
	deriveWorkspaceCardVariant,
	getVariantAccentColor,
	type WorkspaceCardVariantInput,
} from './workspace_card_variants.js';

function makeInput(overrides: Partial<WorkspaceCardVariantInput> = {}): WorkspaceCardVariantInput {
	return {
		prsNeedingAttention: 0,
		hitlCount: 0,
		afkLoopStatus: 'off',
		lastActivity: new Date().toISOString(),
		openIssueCount: 5,
		...overrides,
	};
}

describe('deriveWorkspaceCardVariant', () => {
	it('returns "default" when no special conditions', () => {
		expect(deriveWorkspaceCardVariant(makeInput())).toBe('default');
	});

	it('returns "urgent" when prs_needing_attention > 0', () => {
		expect(deriveWorkspaceCardVariant(makeInput({ prsNeedingAttention: 2 }))).toBe('urgent');
	});

	it('returns "needs-attention" when hitl_count > 0', () => {
		expect(deriveWorkspaceCardVariant(makeInput({ hitlCount: 1 }))).toBe('needs-attention');
	});

	it('returns "active" when afk_loop_status is "running"', () => {
		expect(deriveWorkspaceCardVariant(makeInput({ afkLoopStatus: 'running' }))).toBe('active');
	});

	it('returns "dormant" when last_activity is >24h ago', () => {
		const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
		expect(deriveWorkspaceCardVariant(makeInput({ lastActivity: thirtyHoursAgo }))).toBe(
			'dormant',
		);
	});

	it('returns "dormant" when last_activity is null', () => {
		expect(deriveWorkspaceCardVariant(makeInput({ lastActivity: null }))).toBe('dormant');
	});

	it('returns "empty" when open_issue_count is 0 and not dormant', () => {
		expect(
			deriveWorkspaceCardVariant(
				makeInput({ openIssueCount: 0, lastActivity: new Date().toISOString() }),
			),
		).toBe('empty');
	});

	it('prioritizes urgent over needs-attention', () => {
		expect(
			deriveWorkspaceCardVariant(makeInput({ prsNeedingAttention: 1, hitlCount: 2 })),
		).toBe('urgent');
	});

	it('prioritizes needs-attention over active', () => {
		expect(
			deriveWorkspaceCardVariant(makeInput({ hitlCount: 1, afkLoopStatus: 'running' })),
		).toBe('needs-attention');
	});

	it('prioritizes active over dormant', () => {
		const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
		expect(
			deriveWorkspaceCardVariant(
				makeInput({ afkLoopStatus: 'running', lastActivity: oldDate }),
			),
		).toBe('active');
	});

	it('prioritizes dormant over empty', () => {
		expect(
			deriveWorkspaceCardVariant(makeInput({ openIssueCount: 0, lastActivity: null })),
		).toBe('dormant');
	});

	it('does not treat just under 24h as dormant', () => {
		const justUnder24h = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
		expect(deriveWorkspaceCardVariant(makeInput({ lastActivity: justUnder24h }))).toBe(
			'default',
		);
	});
});

describe('getVariantAccentColor', () => {
	it('returns red for urgent variant', () => {
		expect(getVariantAccentColor('urgent', '#62874b')).toBe('oklch(0.620 0.205 25)');
	});

	it('returns amber for needs-attention variant', () => {
		expect(getVariantAccentColor('needs-attention', '#62874b')).toBe('oklch(0.770 0.155 75)');
	});

	it('returns original color for default variant', () => {
		expect(getVariantAccentColor('default', '#62874b')).toBe('#62874b');
	});

	it('returns original color for active variant', () => {
		expect(getVariantAccentColor('active', '#abc123')).toBe('#abc123');
	});

	it('returns original color for dormant variant', () => {
		expect(getVariantAccentColor('dormant', '#abc123')).toBe('#abc123');
	});

	it('returns original color for empty variant', () => {
		expect(getVariantAccentColor('empty', '#abc123')).toBe('#abc123');
	});
});

import type { SessionState } from '$lib/types/generated/SessionState.js';

interface SessionBadgeConfig {
	variant: 'success' | 'warning' | 'info' | 'moss' | 'danger' | 'default';
	label: string;
	pulse: boolean;
}

export const SESSION_BADGE_CONFIG: Record<SessionState, SessionBadgeConfig> = {
	running: { variant: 'success', label: 'Running', pulse: true },
	'needs-input': { variant: 'warning', label: 'Needs Input', pulse: true },
	'needs-review': { variant: 'info', label: 'Needs Review', pulse: false },
	paused: { variant: 'warning', label: 'Stopped', pulse: false },
	finished: { variant: 'moss', label: 'Finished', pulse: false },
	errored: { variant: 'danger', label: 'Errored', pulse: false },
};

export function getContextColor(percent: number): string {
	if (percent > 60) {
		return 'var(--status-danger)';
	}
	if (percent > 40) {
		return 'var(--status-warning)';
	}
	return 'var(--status-success)';
}

export function getQuotaColor(percent: number): string {
	if (percent > 85) {
		return 'var(--status-danger)';
	}
	if (percent > 60) {
		return 'var(--status-warning)';
	}
	return 'var(--status-success)';
}

interface ProviderConfig {
	name: string;
	color: string;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
	'claude-code': { name: 'Claude Code', color: 'var(--amber-400)' },
	'open-code': { name: 'OpenCode', color: 'var(--azure-400)' },
	codex: { name: 'Codex', color: 'var(--status-success)' },
	cursor: { name: 'Cursor', color: 'var(--foreground-muted)' },
};

export function getProviderConfig(provider: string): ProviderConfig {
	return PROVIDER_CONFIGS[provider] ?? { name: provider, color: 'var(--foreground-subtle)' };
}

export function getStatePulseColor(state: SessionState): string {
	if (state === 'running') {
		return 'var(--status-success)';
	}
	if (state === 'errored') {
		return 'var(--status-danger)';
	}
	return 'var(--status-warning)';
}

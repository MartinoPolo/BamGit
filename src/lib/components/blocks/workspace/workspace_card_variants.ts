const WORKSPACE_CARD_VARIANTS = [
	'urgent',
	'needs-attention',
	'active',
	'dormant',
	'empty',
	'default',
] as const;

export type WorkspaceCardVariant = (typeof WORKSPACE_CARD_VARIANTS)[number];

export const AFK_LOOP_RUNNING = 'running' as const;

export interface WorkspaceCardVariantInput {
	prsNeedingAttention: number;
	hitlCount: number;
	afkLoopStatus: string;
	lastActivity: string | null;
	openIssueCount: number;
}

const DORMANT_THRESHOLD_MS = 24 * 60 * 60 * 1000;

const URGENT_ACCENT = 'oklch(0.620 0.205 25)';
const NEEDS_ATTENTION_ACCENT = 'oklch(0.770 0.155 75)';

function isDormant(lastActivity: string | null): boolean {
	if (lastActivity == null) {
		return true;
	}
	const elapsed = Date.now() - new Date(lastActivity).getTime();
	return elapsed > DORMANT_THRESHOLD_MS;
}

export function deriveWorkspaceCardVariant(input: WorkspaceCardVariantInput): WorkspaceCardVariant {
	if (input.prsNeedingAttention > 0) {
		return 'urgent';
	}
	if (input.hitlCount > 0) {
		return 'needs-attention';
	}
	if (input.afkLoopStatus === AFK_LOOP_RUNNING) {
		return 'active';
	}
	if (isDormant(input.lastActivity)) {
		return 'dormant';
	}
	if (input.openIssueCount === 0) {
		return 'empty';
	}
	return 'default';
}

export function getVariantAccentColor(
	variant: WorkspaceCardVariant,
	originalColor: string,
): string {
	if (variant === 'urgent') {
		return URGENT_ACCENT;
	}
	if (variant === 'needs-attention') {
		return NEEDS_ATTENTION_ACCENT;
	}
	return originalColor;
}

import type { OverlayConfig } from 'low-poly-2d-trees';

const INTERACTION_GLOW_INTENSITY = 3;

export interface ResolveGlowOverlayParams {
	readonly stateOverlay: OverlayConfig;
	readonly issueId: string;
	readonly hoveredIssueId: string | null;
	readonly activeIssueId: string | null;
	readonly batchSelectedIssueIds: ReadonlySet<string>;
	readonly issueColor: string;
	readonly batchSelectedGlowColor: string;
}

export function resolveGlowOverlay(params: ResolveGlowOverlayParams): OverlayConfig {
	// Priority: hover(1) > active(2) > batch-selected(3) > state-driven(4-6)
	if (params.issueId === params.hoveredIssueId) {
		return {
			glow: {
				enabled: true,
				color: params.issueColor,
				intensity: INTERACTION_GLOW_INTENSITY,
				pulse: false,
			},
		};
	}
	if (params.issueId === params.activeIssueId) {
		return {
			glow: {
				enabled: true,
				color: params.issueColor,
				intensity: INTERACTION_GLOW_INTENSITY,
				pulse: false,
			},
		};
	}
	if (params.batchSelectedIssueIds.has(params.issueId)) {
		return {
			glow: {
				enabled: true,
				color: params.batchSelectedGlowColor,
				intensity: INTERACTION_GLOW_INTENSITY,
				pulse: false,
			},
		};
	}
	return params.stateOverlay;
}

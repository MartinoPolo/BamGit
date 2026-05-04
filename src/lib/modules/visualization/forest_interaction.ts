import type { OverlayConfig } from 'low-poly-2d-trees';

const INTERACTION_GLOW_INTENSITY = 3;

export interface ResolveGlowOverlayParams {
	readonly stateOverlay: OverlayConfig;
	readonly issueId: string;
	readonly hoveredIssueId: string | null;
	readonly selectedIssueId: string | null;
	readonly batchSelectedIssueIds: ReadonlySet<string>;
	readonly hoverGlowColor: string;
	readonly selectedGlowColor: string;
	readonly batchSelectedGlowColor: string;
}

export function resolveGlowOverlay(params: ResolveGlowOverlayParams): OverlayConfig {
	// Priority: hover(1) > selected(2) > batch-selected(3) > state-driven(4-6)
	if (params.issueId === params.hoveredIssueId) {
		return {
			glow: {
				enabled: true,
				color: params.hoverGlowColor,
				intensity: INTERACTION_GLOW_INTENSITY,
				pulse: false,
			},
		};
	}
	if (params.issueId === params.selectedIssueId) {
		return {
			glow: {
				enabled: true,
				color: params.selectedGlowColor,
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

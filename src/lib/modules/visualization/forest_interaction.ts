import type { OverlayConfig } from 'low-poly-2d-trees';

const INTERACTION_GLOW_INTENSITY = 3;

export interface ResolveGlowOverlayParams {
	readonly stateOverlay: OverlayConfig;
	readonly issueId: string;
	readonly hoveredIssueId: string | null;
	readonly selectedIssueId: string | null;
	readonly hoverGlowColor: string;
	readonly selectedGlowColor: string;
}

export function resolveGlowOverlay(params: ResolveGlowOverlayParams): OverlayConfig {
	// Priority: hover(1) > selected(2) > state-driven(3-6)
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
	return params.stateOverlay;
}

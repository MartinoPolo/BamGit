import { getContrastTextColor } from '$lib/components/derived/color-picker/color_utils.js';
import type { IssueCardAppearanceSettings, IssueCardVariant } from './issue_card_settings.js';

interface VariantCssInput {
	readonly variant: IssueCardVariant;
	readonly settings: IssueCardAppearanceSettings;
	readonly issueColor: string;
	readonly theme: 'dark' | 'light';
}

function computeSharedProperties(issueColor: string, overlayGlow: number): Record<string, string> {
	return {
		'--ic-color': issueColor,
		'--ic-header-text': getContrastTextColor(issueColor),
		'--ic-overlay-glow': String(overlayGlow / 100),
	};
}

function computeVeilProperties(
	settings: IssueCardAppearanceSettings,
	theme: 'dark' | 'light',
): Record<string, string> {
	return {
		'--ic-gradient-reach': `${settings.gradientReach}%`,
		'--ic-color-sat': `${settings.colorSaturation}%`,
		'--ic-mix-target': theme === 'dark' ? '#1e1e1e' : '#ffffff',
	};
}

function computeHorizonProperties(settings: IssueCardAppearanceSettings): Record<string, string> {
	return {
		'--ic-sat': String(settings.headerSaturation / 100),
	};
}

function computeRadiantProperties(settings: IssueCardAppearanceSettings): Record<string, string> {
	return {
		'--ic-radial-intensity': String(settings.radialIntensity / 100),
		'--ic-glow-origin': '12% 58%',
	};
}

export function computeVariantCssProperties(input: VariantCssInput): Record<string, string> {
	const shared = computeSharedProperties(input.issueColor, input.settings.overlayGlow);

	switch (input.variant) {
		case 'veil':
			return { ...shared, ...computeVeilProperties(input.settings, input.theme) };
		case 'refined-horizon':
			return { ...shared, ...computeHorizonProperties(input.settings) };
		case 'radiant':
			return { ...shared, ...computeRadiantProperties(input.settings) };
	}
}

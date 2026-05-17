import { getContrastTextColor } from '$lib/components/derived/color-picker/color_utils.js';
import type { IssueCardAppearanceSettings, IssueCardVariant } from './issue_card_settings.js';
import type { IssueCardState } from './issue_card_variants.js';

// ── Types ─────────────────────────────────────────────────────

export interface VariantSlotStyles {
	readonly card: Readonly<Record<string, string>>;
	readonly header: Readonly<Record<string, string>>;
	readonly preview: Readonly<Record<string, string>>;
}

export interface VariantStylesInput {
	readonly variant: IssueCardVariant;
	readonly settings: IssueCardAppearanceSettings;
	readonly issueColor: string;
	readonly state: IssueCardState;
	readonly isHovered: boolean;
}

// ── Helpers ───────────────────────────────────────────────────

export function styleMapToString(styles: Readonly<Record<string, string>>): string {
	return Object.entries(styles)
		.map(([key, value]) => `${key}: ${value}`)
		.join('; ');
}

// ── Veil ──────────────────────────────────────────────────────

function computeVeilStyles(
	issueColor: string,
	settings: IssueCardAppearanceSettings,
): VariantSlotStyles {
	const mixTarget = 'var(--background)';
	const sat = settings.colorSaturation;
	const reach = settings.gradientReach;

	return {
		card: {
			background: `linear-gradient(180deg, color-mix(in oklch, ${issueColor} calc(${sat}% * 0.77), ${mixTarget}) 0%, color-mix(in oklch, ${issueColor} calc(${sat}% * 0.43), ${mixTarget}) calc(${reach}% * 0.4), color-mix(in oklch, ${issueColor} calc(${sat}% * 0.15), ${mixTarget}) calc(${reach}% * 0.75), var(--surface) ${reach}%)`,
			'border-color': `color-mix(in oklch, ${issueColor} 18%, var(--border))`,
			'box-shadow': `var(--shadow-sm), 0 0 16px -4px color-mix(in oklch, ${issueColor} 12%, transparent)`,
		},
		header: {
			background: 'transparent',
		},
		preview: {
			background: `linear-gradient(180deg, color-mix(in oklch, ${issueColor} var(--tree-bg-mix), var(--surface-2, hsl(0 0% 12%))) 0%, color-mix(in oklch, ${issueColor} 5%, var(--surface-3, hsl(0 0% 10%))) 100%)`,
		},
	};
}

// ── Refined Horizon ───────────────────────────────────────────

function computeHorizonStyles(
	issueColor: string,
	settings: IssueCardAppearanceSettings,
): VariantSlotStyles {
	const sat = settings.headerSaturation / 100;

	return {
		card: {
			background: `linear-gradient(to bottom, color-mix(in oklch, ${issueColor} 4%, var(--surface)) 0%, var(--surface) 100%)`,
			'border-color': `color-mix(in oklch, ${issueColor} 18%, var(--border))`,
			'box-shadow': 'var(--shadow-md)',
		},
		header: {
			background: `linear-gradient(to right, color-mix(in oklch, ${issueColor} calc(${sat} * 77%), var(--surface-2)) 0%, color-mix(in oklch, ${issueColor} calc(${sat} * 28%), var(--surface-2)) 100%)`,
			'border-bottom': `1px solid color-mix(in oklch, ${issueColor} 22%, var(--border))`,
		},
		preview: {
			background: `linear-gradient(180deg, color-mix(in oklch, ${issueColor} 20%, var(--surface-2)) 0%, color-mix(in oklch, ${issueColor} 5%, var(--surface-3)) 100%)`,
		},
	};
}

// ── Radiant ───────────────────────────────────────────────────

function computeRadiantStyles(
	issueColor: string,
	settings: IssueCardAppearanceSettings,
): VariantSlotStyles {
	const intensity = settings.radialIntensity / 100;
	const glowOrigin = '12% 58%';

	return {
		card: {
			background: `radial-gradient(ellipse 340px 300px at ${glowOrigin}, color-mix(in oklch, ${issueColor} calc(35% * ${intensity}), transparent) 0%, color-mix(in oklch, ${issueColor} calc(16% * ${intensity}), transparent) 42%, color-mix(in oklch, ${issueColor} calc(5% * ${intensity}), transparent) 65%, transparent 85%), var(--surface)`,
			'border-color': `color-mix(in oklch, ${issueColor} 28%, var(--border))`,
			'box-shadow': `inset 0 0 18px 0 color-mix(in oklch, ${issueColor} 14%, transparent), 0 2px 10px color-mix(in oklch, var(--background) 55%, transparent)`,
		},
		header: {
			background: `linear-gradient(90deg, color-mix(in oklch, var(--surface) 35%, transparent) 0%, color-mix(in oklch, var(--surface) 65%, transparent) 40%, color-mix(in oklch, var(--surface) 80%, transparent) 100%)`,
		},
		preview: {
			background: `linear-gradient(135deg, color-mix(in oklch, ${issueColor} 5%, var(--surface-2)) 0%, var(--surface-3) 100%)`,
		},
	};
}

// ── State overrides ───────────────────────────────────────────

function applyHoverHeaderBrighten(
	baseHeader: Readonly<Record<string, string>>,
): Record<string, string> {
	const header: Record<string, string> = { ...baseHeader };
	header['--header-brightness'] = '1.12';
	header['--header-saturate'] = '1.12';
	return header;
}

function applyStateOverrides(
	base: VariantSlotStyles,
	state: IssueCardState,
	isHovered: boolean,
	issueColor: string,
): VariantSlotStyles {
	const card: Record<string, string> = { ...base.card };
	let header: Readonly<Record<string, string>> = base.header;

	switch (state) {
		case 'interactive':
			if (isHovered) {
				card['box-shadow'] =
					`0 0 20px 2px color-mix(in oklch, ${issueColor} 14%, transparent), 0 6px 16px 0 color-mix(in oklch, ${issueColor} 12%, transparent), var(--shadow-lg)`;
				card.transform = 'translateY(-3px)';
				header = applyHoverHeaderBrighten(base.header);
			}
			break;

		case 'hovered':
			card['box-shadow'] =
				`0 0 20px 2px color-mix(in oklch, ${issueColor} 14%, transparent), 0 6px 16px 0 color-mix(in oklch, ${issueColor} 12%, transparent), var(--shadow-lg)`;
			card.transform = 'translateY(-3px)';
			header = applyHoverHeaderBrighten(base.header);
			break;

		case 'selectionHover':
			card.outline = `3px solid ${issueColor}`;
			card['outline-offset'] = '-3px';
			card['box-shadow'] =
				`0 0 24px 4px color-mix(in oklch, ${issueColor} 28%, transparent), 0 6px 16px 0 color-mix(in oklch, ${issueColor} 18%, transparent), var(--shadow-lg)`;
			card.transform = 'translateY(-3px)';
			header = applyHoverHeaderBrighten(base.header);
			break;

		case 'active':
			card['box-shadow'] =
				`0 0 12px 2px color-mix(in oklch, ${issueColor} 18%, transparent), 0 0 4px 0 color-mix(in oklch, ${issueColor} 10%, transparent), var(--shadow-md)`;
			if (isHovered) {
				card['box-shadow'] =
					`0 0 24px 4px color-mix(in oklch, ${issueColor} 22%, transparent), 0 6px 16px 0 color-mix(in oklch, ${issueColor} 16%, transparent), var(--shadow-lg)`;
				card.transform = 'translateY(-3px)';
				header = applyHoverHeaderBrighten(base.header);
			}
			break;

		case 'selected':
			card.outline = `3px solid ${issueColor}`;
			card['outline-offset'] = '-3px';
			card['box-shadow'] =
				`0 0 20px 2px color-mix(in oklch, ${issueColor} 22%, transparent), 0 4px 12px 0 color-mix(in oklch, ${issueColor} 14%, transparent), var(--shadow-lg)`;
			if (isHovered) {
				card['box-shadow'] =
					`0 0 24px 4px color-mix(in oklch, ${issueColor} 28%, transparent), 0 6px 16px 0 color-mix(in oklch, ${issueColor} 18%, transparent), var(--shadow-lg)`;
				card.transform = 'translateY(-2px)';
				header = applyHoverHeaderBrighten(base.header);
			}
			break;

		case 'done':
			card.background = 'transparent';
			card['border-color'] = 'transparent';
			card['box-shadow'] = 'none';
			break;

		case 'worktreeSetup':
			card['border-style'] = 'dashed';
			card['border-color'] = 'var(--muted)';
			card.opacity = '0.6';
			break;

		case 'archived':
			card.opacity = '0.7';
			card.filter = 'grayscale(0.8)';
			break;
	}

	return { card, header, preview: base.preview };
}

// ── Main export ───────────────────────────────────────────────

export function computeVariantSlotStyles(input: VariantStylesInput): VariantSlotStyles {
	const { variant, issueColor, settings, state, isHovered } = input;

	const sharedCardProps: Record<string, string> = {
		'--ic-color': issueColor,
		'--ic-header-text':
			variant === 'veil' ? getContrastTextColor(issueColor) : 'var(--foreground)',
		'--ic-overlay-glow': String(settings.overlayGlow / 100),
	};

	let base: VariantSlotStyles;
	switch (variant) {
		case 'veil':
			base = computeVeilStyles(issueColor, settings);
			break;
		case 'refined-horizon':
			base = computeHorizonStyles(issueColor, settings);
			break;
		case 'radiant':
			base = computeRadiantStyles(issueColor, settings);
			break;
	}

	base = {
		card: { ...sharedCardProps, ...base.card },
		header: base.header,
		preview: base.preview,
	};

	return applyStateOverrides(base, state, isHovered, issueColor);
}

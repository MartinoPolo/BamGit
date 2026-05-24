import { getContrastTextColor } from '$lib/components/derived/color-picker/color_utils.js';
import type { IssueCardAppearanceSettings, IssueCardVariant } from './issue_card_settings.js';
import type { IssueCardState } from './issue_card_variants.js';
import type { SessionOverlay } from './types.js';

// ── Types ─────────────────────────────────────────────────────

export interface VariantSlotStyles {
	readonly card: Readonly<Record<string, string>>;
	readonly header: Readonly<Record<string, string>>;
	readonly preview: Readonly<Record<string, string>>;
}

interface VariantStylesInput {
	readonly variant: IssueCardVariant;
	readonly settings: IssueCardAppearanceSettings;
	readonly issueColor: string;
	readonly state: IssueCardState;
	readonly isHovered: boolean;
	readonly isDone: boolean;
	readonly sessionOverlay: SessionOverlay;
	readonly labels: ReadonlyArray<{ readonly name: string; readonly color: string }>;
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
			background: 'color-mix(in oklch, var(--surface) 85%, black)',
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

function applyHoverGlow(
	card: Record<string, string>,
	baseHeader: Readonly<Record<string, string>>,
	issueColor: string,
): Record<string, string> {
	card['box-shadow'] =
		`0 0 20px 2px color-mix(in oklch, ${issueColor} 14%, transparent), 0 6px 16px 0 color-mix(in oklch, ${issueColor} 12%, transparent), var(--shadow-lg)`;
	card.transform = 'translateY(-3px)';
	return applyHoverHeaderBrighten(baseHeader);
}

function applyStateOverrides(
	base: VariantSlotStyles,
	state: IssueCardState,
	isHovered: boolean,
	issueColor: string,
	isDone: boolean = false,
): VariantSlotStyles {
	const card: Record<string, string> = { ...base.card };
	let header: Readonly<Record<string, string>> = base.header;

	switch (state) {
		case 'ghost':
			break;

		case 'interactive':
			if (isHovered) {
				header = applyHoverGlow(card, base.header, issueColor);
			}
			break;

		case 'done':
			card.background = 'transparent';
			card['border-color'] = 'transparent';
			card['box-shadow'] = 'none';
			break;

		case 'hovered':
			if (isDone) {
				card.background = 'var(--surface)';
				card['border-color'] = 'var(--border)';
				card['box-shadow'] = 'var(--shadow-sm)';
				card.transform = 'translateY(-2px)';
			} else {
				header = applyHoverGlow(card, base.header, issueColor);
			}
			break;

		case 'selectionHover':
			card.outline = `3px solid var(--primary)`;
			card['outline-offset'] = '-3px';
			card['box-shadow'] =
				`0 0 24px 4px color-mix(in oklch, var(--primary) 28%, transparent), 0 6px 16px 0 color-mix(in oklch, var(--primary) 18%, transparent), var(--shadow-lg)`;
			card.transform = 'translateY(-3px)';
			card.cursor = 'pointer';
			header = applyHoverHeaderBrighten(base.header);
			break;

		case 'active':
			card.outline = `3px solid ${issueColor}`;
			card['outline-offset'] = '-3px';
			card['box-shadow'] =
				`0 0 0 8px color-mix(in oklch, ${issueColor} 40%, transparent), 0 0 24px 4px color-mix(in oklch, ${issueColor} 25%, transparent), 0 4px 12px 0 color-mix(in oklch, ${issueColor} 16%, transparent), var(--shadow-lg)`;
			if (isHovered) {
				card['box-shadow'] =
					`0 0 0 8px color-mix(in oklch, ${issueColor} 50%, transparent), 0 0 28px 6px color-mix(in oklch, ${issueColor} 30%, transparent), 0 6px 16px 0 color-mix(in oklch, ${issueColor} 20%, transparent), var(--shadow-lg)`;
				card.transform = 'translateY(-2px)';
				header = applyHoverHeaderBrighten(base.header);
			}
			break;

		case 'selected':
			card.outline = `3px solid var(--primary)`;
			card['outline-offset'] = '-3px';
			card['box-shadow'] =
				`0 0 20px 2px color-mix(in oklch, var(--primary) 22%, transparent), 0 4px 12px 0 color-mix(in oklch, var(--primary) 14%, transparent), var(--shadow-lg)`;
			if (isHovered) {
				card['box-shadow'] =
					`0 0 24px 4px color-mix(in oklch, var(--primary) 28%, transparent), 0 6px 16px 0 color-mix(in oklch, var(--primary) 18%, transparent), var(--shadow-lg)`;
				card.transform = 'translateY(-2px)';
				header = applyHoverHeaderBrighten(base.header);
			}
			break;

		case 'worktreeSetup':
			card['border-color'] = 'transparent';
			card.opacity = '0.6';
			break;

		case 'archived':
			card.opacity = '0.7';
			card.filter = 'grayscale(0.8)';
			break;
	}

	return { card, header, preview: base.preview };
}

// ── Session overlay ──────────────────────────────────────────

function applySessionOverlay(
	base: VariantSlotStyles,
	sessionOverlay: SessionOverlay,
): VariantSlotStyles {
	if (sessionOverlay === null) {
		return base;
	}

	const card: Record<string, string> = { ...base.card };
	const existingBoxShadow = card['box-shadow'] ?? '';

	const overlayConfig = {
		error: {
			colorVar: 'var(--session-errored)',
			animation: 'ic-error-pulse 2s ease-in-out infinite',
		},
		'needs-input': {
			colorVar: 'var(--session-needs-input)',
			animation: 'ic-needs-input-pulse 2s ease-in-out infinite',
		},
	} as const satisfies Record<
		NonNullable<SessionOverlay>,
		{ colorVar: string; animation: string }
	>;

	const config = overlayConfig[sessionOverlay];
	card['border-color'] = config.colorVar;
	card['animation'] = config.animation;
	card['box-shadow'] =
		`0 0 calc(16px * var(--ic-overlay-glow)) calc(2px * var(--ic-overlay-glow)) color-mix(in oklch, ${config.colorVar} 25%, transparent)${existingBoxShadow ? `, ${existingBoxShadow}` : ''}`;
	card['--ic-session-tint'] = config.colorVar;

	return { card, header: base.header, preview: base.preview };
}

// ── Ghost label tinting ──────────────────────────────────────

const GHOST_NEUTRAL_BASE = '#1e1e1e';

function computeGhostLabelTint(
	labels: ReadonlyArray<{ readonly name: string; readonly color: string }>,
	labelTint: number,
): { card: Record<string, string>; header: Record<string, string>; hasLabels: boolean } {
	if (labels.length === 0) {
		return {
			card: { background: GHOST_NEUTRAL_BASE },
			header: { background: 'transparent' },
			hasLabels: false,
		};
	}

	const sorted = [...labels].sort((a, b) => a.name.localeCompare(b.name));

	if (sorted.length === 1) {
		const color = sorted[0].color;
		return {
			card: {
				background: `color-mix(in oklch, ${color} ${labelTint}%, ${GHOST_NEUTRAL_BASE})`,
			},
			header: {
				background: `color-mix(in oklch, ${color} ${labelTint * 2}%, ${GHOST_NEUTRAL_BASE})`,
			},
			hasLabels: true,
		};
	}

	// 2+ labels: split colorization with first 2 alphabetically
	const leftColor = sorted[0].color;
	const rightColor = sorted[1].color;
	return {
		card: {
			background: `linear-gradient(to right, color-mix(in oklch, ${leftColor} ${labelTint}%, ${GHOST_NEUTRAL_BASE}) 0%, ${GHOST_NEUTRAL_BASE} 50%, color-mix(in oklch, ${rightColor} ${labelTint}%, ${GHOST_NEUTRAL_BASE}) 100%)`,
		},
		header: {
			background: `linear-gradient(to right, color-mix(in oklch, ${leftColor} ${labelTint * 2}%, ${GHOST_NEUTRAL_BASE}) 0%, ${GHOST_NEUTRAL_BASE} 50%, color-mix(in oklch, ${rightColor} ${labelTint * 2}%, ${GHOST_NEUTRAL_BASE}) 100%)`,
		},
		hasLabels: true,
	};
}

// ── Main export ───────────────────────────────────────────────

export function computeVariantSlotStyles(input: VariantStylesInput): VariantSlotStyles {
	const { variant, issueColor, settings, state, isHovered, sessionOverlay, labels } = input;

	// Ghost cards bypass variant-specific styling
	if (state === 'ghost') {
		const tint = computeGhostLabelTint(labels, settings.labelTint);
		const card: Record<string, string> = {
			'--ic-color': issueColor,
			'--ic-header-text': 'var(--foreground)',
			'--ic-number-color': 'inherit',
			'--ic-overlay-glow': '0',
			...tint.card,
			'border-style': 'dashed',
			'border-color': 'var(--border)',
			'box-shadow': 'none',
			opacity: '0.82',
		};
		const header: Record<string, string> = { ...tint.header };

		if (isHovered) {
			card['border-color'] = 'var(--border-strong)';
			if (tint.hasLabels) {
				card.background = `linear-gradient(135deg, color-mix(in oklch, var(--foreground) 5%, transparent) 0%, transparent 100%), ${tint.card.background}`;
			} else {
				card.background = `linear-gradient(135deg, color-mix(in oklch, var(--foreground) 5%, ${GHOST_NEUTRAL_BASE}) 0%, ${GHOST_NEUTRAL_BASE} 100%)`;
			}
			card.transform = 'translateY(-2px)';
			card.opacity = '0.92';
		}

		return { card, header, preview: {} };
	}

	const sharedCardProps: Record<string, string> = {
		'--ic-color': issueColor,
		'--ic-header-text':
			variant === 'veil' ? getContrastTextColor(issueColor) : 'var(--foreground)',
		'--ic-number-color': variant === 'radiant' ? issueColor : 'inherit',
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

	const afterState = applyStateOverrides(base, state, isHovered, issueColor, input.isDone);
	return applySessionOverlay(afterState, sessionOverlay);
}

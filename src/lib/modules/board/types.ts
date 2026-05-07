import type { ColorPalette } from '$lib/types/generated';

// ─── Frontend-only request types ──────────────────────────────────────────

export interface CreateDashboardRequest {
	name: string;
	type: 'repo' | 'portfolio';
	github_repo?: string | null;
	local_folder?: string | null;
	default_base_branch?: string | null;
	worktree_parent_folder?: string | null;
	color_palette_id?: string | null;
	accent_color?: string | null;
	default_shape?: string;
}

/** Absent key = no change, explicit null = clear the field */
export interface UpdateDashboardRequest {
	id: string;
	name?: string;
	type?: 'repo' | 'portfolio';
	github_repo?: string | null;
	local_folder?: string | null;
	default_base_branch?: string | null;
	worktree_parent_folder?: string | null;
	color_palette_id?: string | null;
	accent_color?: string | null;
	default_shape?: string;
}

export interface CreateColorPaletteRequest {
	name: string;
	colors: string[];
}

/** @public */
export interface UpdateColorPaletteRequest {
	id: string;
	name?: string;
	colors?: string[];
}

/** @public */
export interface AddRepoToPortfolioRequest {
	portfolio_dashboard_id: string;
	repo_dashboard_id: string;
}

// ─── Frontend-only value types ────────────────────────────────────────────

/** @public */
export type ThemeMode = 'dark' | 'light' | 'system';

export const ACCENT_COLORS = [
	'moss',
	'amber',
	'gold',
	'coral',
	'rose',
	'fuchsia',
	'sage',
	'teal',
	'azure',
	'indigo',
	'plum',
	'bark',
] as const;
/** @public */
export type AccentColor = (typeof ACCENT_COLORS)[number];

// ─── Type guards ──────────────────────────────────────────────────────────

export function isThemeMode(value: unknown): value is ThemeMode {
	return value === 'dark' || value === 'light' || value === 'system';
}

export function isAccentColor(value: unknown): value is AccentColor {
	return typeof value === 'string' && ACCENT_COLORS.includes(value as AccentColor);
}

export function findPaletteForDashboard(
	palettes: ColorPalette[],
	colorPaletteId: string | null,
	defaultPaletteId: string,
): ColorPalette | null {
	if (colorPaletteId === null) {
		return palettes.find((p) => p.id === defaultPaletteId) ?? palettes[0] ?? null;
	}
	return palettes.find((p) => p.id === colorPaletteId) ?? null;
}

export function selectActiveDashboardId(
	dashboards: { id: string }[],
	lastViewedId: string | null,
): string | null {
	if (lastViewedId !== null && dashboards.some((d) => d.id === lastViewedId)) {
		return lastViewedId;
	}
	if (dashboards.length > 0) {
		return dashboards[0].id;
	}
	return null;
}

export function resolveActiveDashboardId(
	dashboards: { id: string }[],
	currentActiveId: string | null,
): string | null {
	if (currentActiveId !== null && dashboards.some((d) => d.id === currentActiveId)) {
		return currentActiveId;
	}
	return dashboards.length > 0 ? dashboards[0].id : null;
}

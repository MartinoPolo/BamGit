// ─── Frontend-only request types ──────────────────────────────────────────

export interface CreateDashboardRequest {
	name: string;
	type: 'repo' | 'portfolio';
	github_repo?: string | null;
	local_folder?: string | null;
	default_base_branch?: string | null;
	worktree_parent_folder?: string | null;
	color_palette_id?: string | null;
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

export type ViewMode = 'cards' | 'forest';
/** @public */
export type ThemeMode = 'dark' | 'light' | 'system';

// ─── Type guards ──────────────────────────────────────────────────────────

export function isThemeMode(value: unknown): value is ThemeMode {
	return value === 'dark' || value === 'light' || value === 'system';
}

export function isViewMode(value: unknown): value is ViewMode {
	return value === 'cards' || value === 'forest';
}

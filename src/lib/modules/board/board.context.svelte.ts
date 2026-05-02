import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { MediaQuery } from 'svelte/reactivity';
import { invoke } from '$lib/tauri.js';
import { Persisted, stringSerde } from '$lib/reactivity/persisted.svelte.js';
import type {
	Dashboard,
	ColorPalette,
	PortfolioDashboardPointer,
	LabelShapeMapping,
} from '$lib/types/generated';
import type {
	CreateDashboardRequest,
	UpdateDashboardRequest,
	CreateColorPaletteRequest,
	UpdateColorPaletteRequest,
	AddRepoToPortfolioRequest,
	ThemeMode,
	AccentColor,
} from './types.js';
import {
	isThemeMode,
	isAccentColor,
	findPaletteForDashboard,
	selectActiveDashboardId,
	resolveActiveDashboardId,
} from './types.js';

// ─── Constants ────────────────────────────────────────────────────────────

/** @public */
export const DEFAULT_PALETTE_ID = 'palette-vivid';
export const FALLBACK_ISSUE_COLOR = '#ef4444';

const LAST_VIEWED_KEY = 'grovekeeper_last_viewed_dashboard_id';

// ─── Context ──────────────────────────────────────────────────────────────

type BoardContext = ReturnType<typeof createBoardContext>;

const [useBoard, setBoardInternal] = createContext<BoardContext>();
export { useBoard };

export function setBoardContext() {
	const ctx = createBoardContext();
	setBoardInternal(ctx);
	return ctx;
}

// ─── Factory ──────────────────────────────────────────────────────────────

function createBoardContext() {
	// ── Dashboard state ────────────────────────────────────────────────────
	let dashboards = $state<Dashboard[]>([]);
	let activeDashboardId = $state<string | null>(null);
	let sidebarCollapsed = $state(false);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showCreateDialog = $state(false);

	const activeDashboard = $derived(
		dashboards.find((dashboard) => dashboard.id === activeDashboardId) ?? null,
	);

	const repoDashboards = $derived(dashboards.filter((d) => d.type === 'repo'));
	const portfolioDashboards = $derived(dashboards.filter((d) => d.type === 'portfolio'));

	// ── Color palette state ────────────────────────────────────────────────
	let palettes = $state<ColorPalette[]>([]);
	let palettesLoading = $state(false);
	let palettesError = $state<string | null>(null);

	// ── Theme state ────────────────────────────────────────────────────────
	const themeMode = new Persisted<ThemeMode>({
		key: 'grovekeeper_theme_mode',
		serde: stringSerde(isThemeMode),
		defaultValue: 'system',
	});

	const accentColor = new Persisted<AccentColor>({
		key: 'grovekeeper_accent_color',
		serde: stringSerde(isAccentColor),
		defaultValue: 'moss',
	});

	const username = new Persisted<string>({
		key: 'grovekeeper_username',
		serde: stringSerde((v): v is string => typeof v === 'string' && v.length > 0),
		defaultValue: 'User',
	});

	const userInitials = new Persisted<string>({
		key: 'grovekeeper_user_initials',
		serde: stringSerde((v): v is string => typeof v === 'string' && v.length > 0),
		defaultValue: 'U',
	});

	const prefersDark = browser ? new MediaQuery('(prefers-color-scheme: dark)') : null;

	const isDark = $derived.by(() => {
		if (themeMode.current === 'system') {
			return prefersDark?.current ?? true;
		}
		return themeMode.current === 'dark';
	});

	$effect.pre(() => {
		if (browser) {
			document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
			document.documentElement.dataset.accent = accentColor.current;
		}
	});

	// ── Public interface ───────────────────────────────────────────────────
	return {
		// Dashboard
		get dashboards() {
			return dashboards;
		},
		get activeDashboard() {
			return activeDashboard;
		},
		get activeDashboardId() {
			return activeDashboardId;
		},
		get repoDashboards() {
			return repoDashboards;
		},
		get portfolioDashboards() {
			return portfolioDashboards;
		},
		get sidebarCollapsed() {
			return sidebarCollapsed;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get showCreateDialog() {
			return showCreateDialog;
		},
		set showCreateDialog(value: boolean) {
			showCreateDialog = value;
		},

		async loadDashboards(preferredDashboardId?: string | null) {
			try {
				loading = true;
				dashboards = await invoke<Dashboard[]>('get_dashboards');
				error = null;

				activeDashboardId = selectActiveDashboardId(
					dashboards,
					preferredDashboardId ?? localStorage.getItem(LAST_VIEWED_KEY),
				);
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		selectDashboard(id: string) {
			activeDashboardId = id;
			localStorage.setItem(LAST_VIEWED_KEY, id);
		},

		toggleSidebar() {
			sidebarCollapsed = !sidebarCollapsed;
		},

		async refreshDashboards() {
			try {
				dashboards = await invoke<Dashboard[]>('get_dashboards');
				error = null;
				activeDashboardId = resolveActiveDashboardId(dashboards, activeDashboardId);
			} catch (err) {
				error = String(err);
			}
		},

		async createDashboard(request: CreateDashboardRequest): Promise<Dashboard> {
			return invoke('create_dashboard', { request });
		},

		async updateDashboard(request: UpdateDashboardRequest): Promise<Dashboard> {
			return invoke('update_dashboard', { request });
		},

		async deleteDashboard(id: string): Promise<void> {
			return invoke('delete_dashboard', { id });
		},

		// Portfolio
		async addRepoToPortfolio(
			request: AddRepoToPortfolioRequest,
		): Promise<PortfolioDashboardPointer> {
			return invoke('add_repo_to_portfolio', { request });
		},

		async removeRepoFromPortfolio(
			portfolioDashboardId: string,
			repoDashboardId: string,
		): Promise<void> {
			return invoke('remove_repo_from_portfolio', {
				portfolioDashboardId,
				repoDashboardId,
			});
		},

		// Color palettes
		get palettes() {
			return palettes;
		},
		get palettesLoading() {
			return palettesLoading;
		},
		get palettesError() {
			return palettesError;
		},

		getPaletteForDashboard(colorPaletteId: string | null): ColorPalette | null {
			return findPaletteForDashboard(palettes, colorPaletteId, DEFAULT_PALETTE_ID);
		},

		async loadPalettes() {
			try {
				palettesLoading = true;
				palettes = await invoke<ColorPalette[]>('get_all_color_palettes');
				palettesError = null;
			} catch (err) {
				palettesError = String(err);
			} finally {
				palettesLoading = false;
			}
		},

		async refreshPalettes() {
			try {
				palettes = await invoke<ColorPalette[]>('get_all_color_palettes');
				palettesError = null;
			} catch (err) {
				palettesError = String(err);
			}
		},

		async getNextColor(dashboardId: string): Promise<string> {
			return invoke('get_next_available_color', { dashboardId });
		},

		async getUsedColors(dashboardId: string): Promise<string[]> {
			return invoke('get_used_colors_for_dashboard', { dashboardId });
		},

		async openTerminal(folderPath: string, tabColor?: string): Promise<void> {
			return invoke('open_terminal', { folderPath, tabColor: tabColor ?? null });
		},

		async createPalette(request: CreateColorPaletteRequest): Promise<ColorPalette> {
			return invoke('create_color_palette', { request });
		},

		async updatePalette(request: UpdateColorPaletteRequest): Promise<ColorPalette> {
			return invoke('update_color_palette', { request });
		},

		async deletePalette(id: string): Promise<void> {
			return invoke('delete_color_palette', { id });
		},

		// Label shape mappings
		async getLabelShapeMappings(dashboardId: string): Promise<LabelShapeMapping[]> {
			return invoke('get_label_shape_mappings', { dashboardId });
		},

		async upsertLabelShapeMapping(
			dashboardId: string,
			labelName: string,
			treeShape: string,
			color: string | null,
			priorityOrder: number,
		): Promise<LabelShapeMapping> {
			return invoke('upsert_label_shape_mapping', {
				dashboardId,
				labelName,
				treeShape,
				color,
				priorityOrder,
			});
		},

		// Theme
		get theme() {
			return {
				get mode() {
					return themeMode.current;
				},
				set mode(value: ThemeMode) {
					themeMode.current = value;
				},
				get isDark() {
					return isDark;
				},
				get prefersDark() {
					return prefersDark?.current ?? true;
				},
				get accent() {
					return accentColor.current;
				},
				set accent(value: AccentColor) {
					accentColor.current = value;
				},
			};
		},

		// User profile
		get username() {
			return username.current;
		},
		set username(value: string) {
			username.current = value;
		},
		get userInitials() {
			return userInitials.current;
		},
		set userInitials(value: string) {
			userInitials.current = value;
		},
	};
}

import { createContext } from 'svelte';
import { invoke } from '$lib/tauri.js';
import type { Dashboard, ColorPalette, LabelShapeMapping } from '$lib/types/generated';
import type {
	CreateDashboardRequest,
	UpdateDashboardRequest,
	CreateColorPaletteRequest,
	UpdateColorPaletteRequest,
} from './types.js';
import {
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

	// ── Color palette state ────────────────────────────────────────────────
	let palettes = $state<ColorPalette[]>([]);
	let palettesLoading = $state(false);
	let palettesError = $state<string | null>(null);

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
			return invoke<Dashboard>('update_dashboard', { request });
		},

		async archiveDashboard(id: string): Promise<void> {
			await invoke('archive_dashboard', { id });
			await this.refreshDashboards();
		},

		async unarchiveDashboard(id: string): Promise<void> {
			await invoke('unarchive_dashboard', { id });
			await this.refreshDashboards();
		},

		async deleteDashboard(id: string, confirmName: string): Promise<void> {
			await invoke('delete_dashboard', { id, confirmName });
			await this.refreshDashboards();
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
	};
}

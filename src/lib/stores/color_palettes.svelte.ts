import type { ColorPalette } from '$lib/types/color_palette';
import { DEFAULT_PALETTE_ID } from '$lib/types/color_palette';
import { getAllColorPalettes, getNextAvailableColor } from '$lib/tauri/color_palette_commands';

let palettes = $state<ColorPalette[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export function getColorPaletteStore() {
	return {
		get palettes() {
			return palettes;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		getPaletteForDashboard(colorPaletteId: string | null): ColorPalette | null {
			if (colorPaletteId === null) {
				return palettes.find((p) => p.id === DEFAULT_PALETTE_ID) ?? palettes[0] ?? null;
			}
			return palettes.find((p) => p.id === colorPaletteId) ?? null;
		},

		async loadPalettes() {
			try {
				loading = true;
				palettes = await getAllColorPalettes();
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh() {
			try {
				palettes = await getAllColorPalettes();
				error = null;
			} catch (err) {
				error = String(err);
			}
		},

		async getNextColor(dashboardId: string): Promise<string> {
			return getNextAvailableColor(dashboardId);
		},
	};
}

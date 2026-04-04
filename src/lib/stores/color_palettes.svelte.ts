import type { ColorPalette } from '$lib/types/color_palette';
import { DEFAULT_PALETTE_ID } from '$lib/types/color_palette';
import {
	get_all_color_palettes,
	get_next_available_color,
} from '$lib/tauri/color_palette_commands';

let palettes = $state<ColorPalette[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export function get_color_palette_store() {
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

		get_palette_for_dashboard(color_palette_id: string | null): ColorPalette | null {
			if (color_palette_id === null) {
				return palettes.find((p) => p.id === DEFAULT_PALETTE_ID) ?? palettes[0] ?? null;
			}
			return palettes.find((p) => p.id === color_palette_id) ?? null;
		},

		async load_palettes() {
			try {
				loading = true;
				palettes = await get_all_color_palettes();
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh() {
			try {
				palettes = await get_all_color_palettes();
				error = null;
			} catch (err) {
				error = String(err);
			}
		},

		async get_next_color(dashboard_id: string): Promise<string> {
			return get_next_available_color(dashboard_id);
		},
	};
}

import { invoke } from '@tauri-apps/api/core';
import type {
	ColorPalette,
	CreateColorPaletteRequest,
	UpdateColorPaletteRequest,
} from '$lib/types/color_palette';

export async function get_all_color_palettes(): Promise<ColorPalette[]> {
	return invoke('get_all_color_palettes');
}

// fallow-ignore-next-line unused-export
export async function get_color_palette(id: string): Promise<ColorPalette> {
	return invoke('get_color_palette', { id });
}

export async function create_color_palette(
	request: CreateColorPaletteRequest,
): Promise<ColorPalette> {
	return invoke('create_color_palette', { request });
}

export async function update_color_palette(
	request: UpdateColorPaletteRequest,
): Promise<ColorPalette> {
	return invoke('update_color_palette', { request });
}

export async function delete_color_palette(id: string): Promise<void> {
	return invoke('delete_color_palette', { id });
}

export async function get_next_available_color(dashboard_id: string): Promise<string> {
	return invoke('get_next_available_color', { dashboardId: dashboard_id });
}

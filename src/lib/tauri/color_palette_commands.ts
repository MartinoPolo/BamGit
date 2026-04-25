import { invoke } from '@tauri-apps/api/core';
import type {
	ColorPalette,
	CreateColorPaletteRequest,
	UpdateColorPaletteRequest,
} from '$lib/types/color_palette';

export async function getAllColorPalettes(): Promise<ColorPalette[]> {
	return invoke('get_all_color_palettes');
}

export async function getColorPalette(id: string): Promise<ColorPalette> {
	return invoke('get_color_palette', { id });
}

export async function createColorPalette(
	request: CreateColorPaletteRequest,
): Promise<ColorPalette> {
	return invoke('create_color_palette', { request });
}

export async function updateColorPalette(
	request: UpdateColorPaletteRequest,
): Promise<ColorPalette> {
	return invoke('update_color_palette', { request });
}

export async function deleteColorPalette(id: string): Promise<void> {
	return invoke('delete_color_palette', { id });
}

export async function getNextAvailableColor(dashboardId: string): Promise<string> {
	return invoke('get_next_available_color', { dashboardId });
}

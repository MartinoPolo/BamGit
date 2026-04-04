export const DEFAULT_PALETTE_ID = 'palette-vivid';
export const FALLBACK_ISSUE_COLOR = '#ef4444';

export interface ColorPalette {
	id: string;
	name: string;
	/** Hex color strings, e.g. ["#ef4444", "#f97316"] */
	colors: string[];
	is_built_in: boolean;
}

export interface CreateColorPaletteRequest {
	name: string;
	colors: string[];
}

export interface UpdateColorPaletteRequest {
	id: string;
	name?: string;
	colors?: string[];
}

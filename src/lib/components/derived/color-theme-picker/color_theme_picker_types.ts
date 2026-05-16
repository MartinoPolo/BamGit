export interface ColorThemeOption {
	readonly value: string;
	readonly label: string;
	readonly swatchColors: readonly string[];
}

export interface ColorThemePickerProps {
	options: readonly ColorThemeOption[];
	value: string;
	onchange: (value: string) => void;
	triggerLabel?: string;
	portalDisabled?: boolean;
}

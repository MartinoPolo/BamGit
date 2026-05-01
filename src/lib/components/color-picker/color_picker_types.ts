type ColorPickerVariant = 'palette' | 'palette-hex' | 'palette-hex-native' | 'hex';

export interface ColorPickerProps {
	variant?: ColorPickerVariant;
	colors?: string[];
	selectedColor: string;
	usedColors?: string[];
	isDarkMode?: boolean;
	onSelect: (color: string) => void;
}

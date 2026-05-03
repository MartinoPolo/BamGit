export interface ColorPickerProps {
	selectedColor: string;
	onSelect: (color: string) => void;
	colors?: string[];
	usedColors?: string[];
	isDarkMode?: boolean;
	displayText?: string;
	side?: 'top' | 'bottom' | 'left' | 'right';
	align?: 'start' | 'center' | 'end';
	open?: boolean;
	portalDisabled?: boolean;
}

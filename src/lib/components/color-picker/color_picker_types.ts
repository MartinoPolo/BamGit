export interface ColorPickerContentProps {
	selectedColor: string;
	onSelect: (color: string) => void;
	onPresetClick?: (color: string) => void;
	colors?: string[];
	usedColors?: string[];
	displayText?: string;
	autofocus?: boolean;
	closeOnPresetClick?: boolean;
	onClose?: () => void;
}

export interface ColorPickerProps extends ColorPickerContentProps {
	isDarkMode?: boolean;
	side?: 'top' | 'bottom' | 'left' | 'right';
	align?: 'start' | 'center' | 'end';
	open?: boolean;
	portalDisabled?: boolean;
}

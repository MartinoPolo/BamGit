export interface StatusRowProps {
	active: boolean;
	label: string;
	meta?: string;
	onclick?: () => void;
	activeColor?: string;
	class?: string;
}

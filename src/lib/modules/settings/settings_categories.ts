import { resolve } from '$app/paths';
import type { Component } from 'svelte';
import SettingsIcon from '@lucide/svelte/icons/settings';
import UserIcon from '@lucide/svelte/icons/user';
import PaletteIcon from '@lucide/svelte/icons/palette';
import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
import BellIcon from '@lucide/svelte/icons/bell';
import SparklesIcon from '@lucide/svelte/icons/sparkles';
import KeyboardIcon from '@lucide/svelte/icons/keyboard';
import GlobeIcon from '@lucide/svelte/icons/globe';
import WrenchIcon from '@lucide/svelte/icons/wrench';
import FolderIcon from '@lucide/svelte/icons/folder';

interface CategoryChild {
	key: string;
	path: string;
	label: string;
}

interface CategoryItem {
	key: string;
	path: string;
	icon: Component<{ size?: number; class?: string }>;
	label: string;
	userOnly: boolean;
	workspaceOnly: boolean;
	fullWidth?: boolean;
	devOnly?: boolean;
	children?: CategoryChild[];
}

export const SETTINGS_CATEGORIES: CategoryItem[] = [
	{
		key: 'workspace',
		path: resolve('/settings/workspace'),
		icon: FolderIcon,
		label: 'Workspace',
		userOnly: false,
		workspaceOnly: true,
	},
	{
		key: 'general',
		path: resolve('/settings/general'),
		icon: SettingsIcon,
		label: 'General',
		userOnly: true,
		workspaceOnly: false,
	},
	{
		key: 'account',
		path: resolve('/settings/account'),
		icon: UserIcon,
		label: 'Account',
		userOnly: true,
		workspaceOnly: false,
	},
	{
		key: 'appearance',
		path: resolve('/settings/appearance'),
		icon: PaletteIcon,
		label: 'Appearance',
		userOnly: false,
		workspaceOnly: false,
	},
	{
		key: 'issue-cards',
		path: resolve('/settings/issue-cards'),
		icon: LayoutGridIcon,
		label: 'Issue Cards',
		userOnly: false,
		workspaceOnly: false,
	},
	{
		key: 'notifications',
		path: resolve('/settings/notifications'),
		icon: BellIcon,
		label: 'Notifications',
		userOnly: false,
		workspaceOnly: false,
		children: [
			{ key: 'events', path: resolve('/settings/notifications/events'), label: 'Events' },
			{
				key: 'packs',
				path: resolve('/settings/notifications/packs'),
				label: 'Sound Packs',
			},
			{
				key: 'characters',
				path: resolve('/settings/notifications/characters'),
				label: 'Characters',
			},
		],
	},
	{
		key: 'ai-config',
		path: resolve('/settings/ai-config'),
		icon: SparklesIcon,
		label: 'AI Configuration',
		userOnly: false,
		workspaceOnly: false,
		fullWidth: true,
	},
	{
		key: 'shortcuts',
		path: resolve('/settings/shortcuts'),
		icon: KeyboardIcon,
		label: 'Keyboard Shortcuts',
		userOnly: true,
		workspaceOnly: false,
	},
	{
		key: 'language',
		path: resolve('/settings/language'),
		icon: GlobeIcon,
		label: 'Language',
		userOnly: true,
		workspaceOnly: false,
	},
	{
		key: 'developer-tools',
		path: resolve('/settings/developer-tools'),
		icon: WrenchIcon,
		label: 'Developer Tools',
		userOnly: true,
		workspaceOnly: false,
		devOnly: true,
	},
];

import type { ChatMessage } from '$lib/modules/chat/index.js';
import type { Component } from 'svelte';
import TerminalIcon from '@lucide/svelte/icons/terminal';
import EyeIcon from '@lucide/svelte/icons/eye';
import PencilIcon from '@lucide/svelte/icons/pencil';
import CodeIcon from '@lucide/svelte/icons/code';
import FolderSearchIcon from '@lucide/svelte/icons/folder-search';
import SearchIcon from '@lucide/svelte/icons/search';
import CpuIcon from '@lucide/svelte/icons/cpu';
import GlobeIcon from '@lucide/svelte/icons/globe';
import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
import ListIcon from '@lucide/svelte/icons/list';
import SettingsIcon from '@lucide/svelte/icons/settings';

// fallow-ignore-next-line complexity
export function extractToolDetail(message: ChatMessage): string {
	if (message.toolInput === undefined || message.toolInput === null) {
		return '';
	}
	if (typeof message.toolInput === 'object' && !Array.isArray(message.toolInput)) {
		const input = message.toolInput as Record<string, unknown>;
		if (typeof input.file_path === 'string') {
			return input.file_path;
		}
		if (typeof input.command === 'string') {
			return `$ ${input.command}`;
		}
		if (typeof input.pattern === 'string') {
			return input.pattern;
		}
	}
	return '';
}

export function extractToolOutput(message: ChatMessage): string {
	if (message.toolOutput === undefined || message.toolOutput === null) {
		return '';
	}
	if (typeof message.toolOutput === 'string') {
		return message.toolOutput;
	}
	return JSON.stringify(message.toolOutput, null, 2);
}

const TOOL_ACCENT_COLORS: Record<string, string> = {
	Bash: 'oklch(0.700 0.150 145)',
	Read: 'oklch(0.660 0.105 220)',
	Write: 'oklch(0.770 0.155 75)',
	Edit: 'oklch(0.700 0.180 50)',
	Glob: 'oklch(0.720 0.130 250)',
	Grep: 'oklch(0.660 0.180 320)',
	Agent: 'oklch(0.620 0.150 280)',
	WebSearch: 'oklch(0.720 0.130 165)',
	WebFetch: 'oklch(0.620 0.150 30)',
	TodoWrite: 'oklch(0.730 0.165 120)',
	Task: 'oklch(0.720 0.060 280)',
};

export function getToolAccentColor(toolName: string): string {
	return TOOL_ACCENT_COLORS[toolName] ?? 'var(--foreground-muted)';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOOL_ICON_MAP: Record<string, Component<any>> = {
	Bash: TerminalIcon,
	Read: EyeIcon,
	Write: PencilIcon,
	Edit: CodeIcon,
	Glob: FolderSearchIcon,
	Grep: SearchIcon,
	Agent: CpuIcon,
	WebSearch: GlobeIcon,
	WebFetch: ArrowDownIcon,
	TodoWrite: ListIcon,
	Task: SettingsIcon,
};

export function getToolIcon(toolName: string): Component {
	return TOOL_ICON_MAP[toolName] ?? TerminalIcon;
}

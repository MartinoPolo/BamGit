import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/tauri.js', () => ({
	invoke: vi.fn(),
}));

import { invoke } from '$lib/tauri.js';
import { focusWindow, listOpenWindows, openWorkspaceWindow } from './window_commands.js';

const mockInvoke = vi.mocked(invoke);

describe('focusWindow', () => {
	it('calls invoke with focus_window command and label', async () => {
		mockInvoke.mockResolvedValueOnce(undefined);
		await focusWindow('workspace-abc');
		expect(mockInvoke).toHaveBeenCalledWith('focus_window', { label: 'workspace-abc' });
	});
});

describe('listOpenWindows', () => {
	it('calls invoke with list_open_windows command', async () => {
		mockInvoke.mockResolvedValueOnce(['overview', 'workspace-abc']);
		const result = await listOpenWindows();
		expect(mockInvoke).toHaveBeenCalledWith('list_open_windows');
		expect(result).toEqual(['overview', 'workspace-abc']);
	});
});

describe('openWorkspaceWindow', () => {
	it('calls invoke with open_workspace_window command and dashboardId', async () => {
		mockInvoke.mockResolvedValueOnce(undefined);
		await openWorkspaceWindow('dash-123');
		expect(mockInvoke).toHaveBeenCalledWith('open_workspace_window', {
			dashboardId: 'dash-123',
		});
	});
});

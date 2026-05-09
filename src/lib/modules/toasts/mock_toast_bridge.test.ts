import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerMockToastBridge, showMockToast } from './mock_toast_bridge.js';

describe('showMockToast', () => {
	beforeEach(() => {
		// Reset showFn to null before each test
		registerMockToastBridge(null as unknown as (title: string, body: string) => void);
	});

	it('produces a toast for every rapid same-command call', () => {
		const spy = vi.fn();
		registerMockToastBridge(spy);

		showMockToast('setup_worktree');
		showMockToast('setup_worktree');

		expect(spy).toHaveBeenCalledTimes(2);
	});

	it('no-ops when showFn is null', () => {
		// showFn is null from beforeEach — should not throw
		expect(() => showMockToast('setup_worktree')).not.toThrow();
	});

	it('uses command-specific title for known commands', () => {
		const spy = vi.fn();
		registerMockToastBridge(spy);

		showMockToast('setup_worktree');

		expect(spy).toHaveBeenCalledWith(
			'Setup worktree is not available',
			'Worktree setup is simulated in browser mode',
		);
	});

	it('uses fallback body for unknown commands', () => {
		const spy = vi.fn();
		registerMockToastBridge(spy);

		showMockToast('unknown_command');

		expect(spy).toHaveBeenCalledWith(
			'Unknown command is not available',
			'unknown_command is simulated in browser mode',
		);
	});

	it('uses action label in title for execute_action with actionId', () => {
		const spy = vi.fn();
		registerMockToastBridge(spy);

		showMockToast('execute_action', { actionId: 'commit-and-push' });

		expect(spy).toHaveBeenCalledWith(
			'Commit and push is not available',
			'Running actions requires the desktop app',
		);
	});

	it('falls back to command title when execute_action has no actionId', () => {
		const spy = vi.fn();
		registerMockToastBridge(spy);

		showMockToast('execute_action');

		expect(spy).toHaveBeenCalledWith(
			'Execute action is not available',
			'Running actions requires the desktop app',
		);
	});

	it('shows toast for test_notification_sound', () => {
		const calls: Array<{ title: string; body: string }> = [];
		registerMockToastBridge((title, body) => calls.push({ title, body }));
		showMockToast('test_notification_sound');
		expect(calls).toHaveLength(1);
		expect(calls[0].body).toContain('desktop app');
	});
});

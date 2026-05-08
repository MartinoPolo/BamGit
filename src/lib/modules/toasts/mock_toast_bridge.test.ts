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

	it('uses fallback message for unknown commands', () => {
		const spy = vi.fn();
		registerMockToastBridge(spy);

		showMockToast('unknown_command');

		expect(spy).toHaveBeenCalledWith(
			'Desktop app required',
			'unknown_command is simulated in browser mode',
		);
	});

	it('uses correct body for known commands', () => {
		const spy = vi.fn();
		registerMockToastBridge(spy);

		showMockToast('setup_worktree');

		expect(spy).toHaveBeenCalledWith(
			'Desktop app required',
			'Worktree setup is simulated in browser mode',
		);
	});
});

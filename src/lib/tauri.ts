import { isTauri, invoke as tauriInvoke } from '@tauri-apps/api/core';
import { listen as tauriListen } from '@tauri-apps/api/event';
import type { InvokeArgs, InvokeOptions } from '@tauri-apps/api/core';
import type { EventCallback, EventName, Options, UnlistenFn } from '@tauri-apps/api/event';

export { isTauri };
export type { UnlistenFn };

export async function invoke<T>(
	command: string,
	args?: InvokeArgs,
	options?: InvokeOptions,
): Promise<T> {
	if (!isTauri()) {
		const { mockInvoke } = await import('./tauri_mock.js');
		return mockInvoke<T>(command, args as Record<string, unknown>);
	}
	return tauriInvoke<T>(command, args, options);
}

export async function listen<T>(
	event: EventName,
	handler: EventCallback<T>,
	options?: Options,
): Promise<UnlistenFn> {
	if (!isTauri()) {
		return () => {};
	}
	return tauriListen(event, handler, options);
}

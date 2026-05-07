import { isTauri } from '$lib/tauri.js';
import { showMockToast } from '$lib/modules/toasts/mock_toast_bridge.js';

export async function openUrl(url: string): Promise<void> {
	if (!isTauri()) {
		window.open(url, '_blank', 'noopener,noreferrer');
		return;
	}
	const { openUrl: tauriOpenUrl } = await import('@tauri-apps/plugin-opener');
	await tauriOpenUrl(url);
}

export async function openPath(path: string): Promise<void> {
	if (!isTauri()) {
		showMockToast('open_path');
		return;
	}
	const { openPath: tauriOpenPath } = await import('@tauri-apps/plugin-opener');
	await tauriOpenPath(path);
}

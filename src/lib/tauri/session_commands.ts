import { invoke } from '@tauri-apps/api/core';
import type {
	AdoptSessionRequest,
	DiscoveredSession,
	Session,
	SpawnSessionRequest,
} from '$lib/types/session';

export async function spawnSession(request: SpawnSessionRequest): Promise<string> {
	return invoke('spawn_session', { request });
}

export async function sendMessage(sessionId: string, message: string): Promise<void> {
	return invoke('send_message', { sessionId, message });
}

export async function interruptSession(sessionId: string): Promise<void> {
	return invoke('interrupt_session', { sessionId });
}

export async function terminateSession(sessionId: string): Promise<void> {
	return invoke('terminate_session', { sessionId });
}

export async function getSessions(): Promise<Session[]> {
	return invoke('get_sessions');
}

export async function getSession(id: string): Promise<Session> {
	return invoke('get_session', { id });
}

export async function discoverExternalSessions(): Promise<DiscoveredSession[]> {
	return invoke('discover_external_sessions');
}

export async function adoptSession(request: AdoptSessionRequest): Promise<string> {
	return invoke('adopt_session', { request });
}

export async function startDiscoveryPolling(intervalMilliseconds?: number): Promise<void> {
	return invoke('start_discovery_polling', { intervalMilliseconds });
}

export async function stopDiscoveryPolling(): Promise<void> {
	return invoke('stop_discovery_polling');
}

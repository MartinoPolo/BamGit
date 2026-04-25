import { invoke } from '@tauri-apps/api/core';
import type {
	AdoptSessionRequest,
	DiscoveredSession,
	Session,
	SpawnSessionRequest,
} from '$lib/types/session';

export async function spawn_session(request: SpawnSessionRequest): Promise<string> {
	return invoke('spawn_session', { request });
}

export async function send_message(session_id: string, message: string): Promise<void> {
	return invoke('send_message', { sessionId: session_id, message });
}

export async function interrupt_session(session_id: string): Promise<void> {
	return invoke('interrupt_session', { sessionId: session_id });
}

export async function terminate_session(session_id: string): Promise<void> {
	return invoke('terminate_session', { sessionId: session_id });
}

export async function get_sessions(): Promise<Session[]> {
	return invoke('get_sessions');
}

// fallow-ignore-next-line unused-export
export async function get_session(id: string): Promise<Session> {
	return invoke('get_session', { id });
}

// fallow-ignore-next-line unused-export
export async function discover_external_sessions(): Promise<DiscoveredSession[]> {
	return invoke('discover_external_sessions');
}

export async function adopt_session(request: AdoptSessionRequest): Promise<string> {
	return invoke('adopt_session', { request });
}

// fallow-ignore-next-line unused-export
export async function start_discovery_polling(interval_milliseconds?: number): Promise<void> {
	return invoke('start_discovery_polling', { intervalMilliseconds: interval_milliseconds });
}

// fallow-ignore-next-line unused-export
export async function stop_discovery_polling(): Promise<void> {
	return invoke('stop_discovery_polling');
}

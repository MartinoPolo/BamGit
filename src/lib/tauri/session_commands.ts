import { invoke } from '@tauri-apps/api/core';
import type { Session, SpawnSessionRequest } from '$lib/types/session';

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

export async function get_session(id: string): Promise<Session> {
	return invoke('get_session', { id });
}

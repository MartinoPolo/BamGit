import { describe, it, expect } from 'vitest';
import {
	computeSessionEventEffects,
	type SessionEventEffects,
	type SessionPatch,
} from './session_events.js';
import type { SessionEvent } from '$lib/types/generated';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(
	overrides: Partial<SessionEvent> & { type: SessionEvent['type'] },
): SessionEvent {
	return overrides as SessionEvent;
}

function computeEffects(
	event: SessionEvent,
	resolvedState: string | null,
	currentCostUsd: number | null,
): SessionEventEffects {
	const effects: SessionEventEffects = computeSessionEventEffects(
		event,
		resolvedState,
		currentCostUsd,
	);
	const patch: SessionPatch = effects.sessionPatch;
	return { ...effects, sessionPatch: patch };
}

// ════════════════════════════════════════════════════════════════════════════
// resolvedState handling
// ════════════════════════════════════════════════════════════════════════════

describe('computeSessionEventEffects — resolvedState', () => {
	it('sets state in patch when resolvedState is non-null', () => {
		const { sessionPatch } = computeEffects(
			makeEvent({ type: 'run_state', state: 'running', error: null }),
			'running',
			null,
		);
		expect(sessionPatch.state).toBe('running');
	});

	it('does not set state in patch when resolvedState is null', () => {
		const { sessionPatch } = computeEffects(
			makeEvent({ type: 'run_state', state: 'running', error: null }),
			null,
			null,
		);
		expect(sessionPatch.state).toBeUndefined();
	});

	it('returns add notification action for needs-input state', () => {
		const { notificationAction } = computeEffects(
			makeEvent({ type: 'run_state', state: 'needs-input', error: null }),
			'needs-input',
			null,
		);
		expect(notificationAction).toEqual({ type: 'add', notificationType: 'needs-input' });
	});

	it('returns add notification action for needs-review state', () => {
		const { notificationAction } = computeEffects(
			makeEvent({ type: 'run_state', state: 'needs-review', error: null }),
			'needs-review',
			null,
		);
		expect(notificationAction).toEqual({ type: 'add', notificationType: 'needs-review' });
	});

	it('returns add notification action for errored state', () => {
		const { notificationAction } = computeEffects(
			makeEvent({ type: 'run_state', state: 'errored', error: null }),
			'errored',
			null,
		);
		expect(notificationAction).toEqual({ type: 'add', notificationType: 'errored' });
	});

	it('returns clear notification action for running state (not in notification map)', () => {
		const { notificationAction } = computeEffects(
			makeEvent({ type: 'run_state', state: 'running', error: null }),
			'running',
			null,
		);
		expect(notificationAction).toEqual({ type: 'clear' });
	});

	it('returns clear notification action for finished state (not in notification map)', () => {
		const { notificationAction } = computeEffects(
			makeEvent({ type: 'run_state', state: 'finished', error: null }),
			'finished',
			null,
		);
		expect(notificationAction).toEqual({ type: 'clear' });
	});

	it('returns null notification action when resolvedState is null', () => {
		const { notificationAction } = computeEffects(
			makeEvent({ type: 'run_state', state: 'running', error: null }),
			null,
			null,
		);
		expect(notificationAction).toBeNull();
	});
});

// ════════════════════════════════════════════════════════════════════════════
// usage_update event
// ════════════════════════════════════════════════════════════════════════════

describe('computeSessionEventEffects — usage_update', () => {
	it('sets cost_usd from event', () => {
		const { sessionPatch } = computeEffects(
			makeEvent({
				type: 'usage_update',
				cost_usd: 0.05,
				input_tokens: 100,
				output_tokens: 50,
			}),
			null,
			null,
		);
		expect(sessionPatch.cost_usd).toBe(0.05);
	});

	it('falls back to currentCostUsd when event cost_usd is falsy (0)', () => {
		// cost_usd = 0 is falsy so ?? falls through to currentCostUsd
		const { sessionPatch } = computeEffects(
			makeEvent({ type: 'usage_update', cost_usd: 0, input_tokens: 100, output_tokens: 50 }),
			null,
			0.99,
		);
		// 0 ?? 0.99 → 0 (0 is not null/undefined)
		expect(sessionPatch.cost_usd).toBe(0);
	});

	it('falls back to currentCostUsd when event cost_usd is null-like', () => {
		// Simulate a payload where cost_usd arrives as null (cast for test purposes)
		const { sessionPatch } = computeEffects(
			makeEvent({
				type: 'usage_update',
				cost_usd: null as unknown as number,
				input_tokens: 10,
				output_tokens: 5,
			}),
			null,
			1.23,
		);
		expect(sessionPatch.cost_usd).toBe(1.23);
	});

	it('sums input and output tokens into token_count', () => {
		const { sessionPatch } = computeEffects(
			makeEvent({
				type: 'usage_update',
				cost_usd: 0.01,
				input_tokens: 300,
				output_tokens: 150,
			}),
			null,
			null,
		);
		expect(sessionPatch.token_count).toBe(450);
	});

	it('treats missing token counts as 0', () => {
		const { sessionPatch } = computeEffects(
			makeEvent({
				type: 'usage_update',
				cost_usd: 0.01,
				input_tokens: null as unknown as number,
				output_tokens: null as unknown as number,
			}),
			null,
			null,
		);
		expect(sessionPatch.token_count).toBe(0);
	});

	it('does not set last_response_summary', () => {
		const { sessionPatch } = computeEffects(
			makeEvent({ type: 'usage_update', cost_usd: 0.01, input_tokens: 10, output_tokens: 5 }),
			null,
			null,
		);
		expect(sessionPatch.last_response_summary).toBeUndefined();
	});
});

// ════════════════════════════════════════════════════════════════════════════
// message_complete event
// ════════════════════════════════════════════════════════════════════════════

describe('computeSessionEventEffects — message_complete', () => {
	it('sets last_response_summary verbatim when text is 200 chars or fewer', () => {
		const text = 'a'.repeat(200);
		const { sessionPatch } = computeEffects(
			makeEvent({ type: 'message_complete', text, message_id: 'msg-1' }),
			null,
			null,
		);
		expect(sessionPatch.last_response_summary).toBe(text);
	});

	it('truncates to 197 chars + ellipsis when text exceeds 200 chars', () => {
		const text = 'b'.repeat(250);
		const { sessionPatch } = computeEffects(
			makeEvent({ type: 'message_complete', text, message_id: 'msg-1' }),
			null,
			null,
		);
		expect(sessionPatch.last_response_summary).toBe('b'.repeat(197) + '...');
		expect(sessionPatch.last_response_summary!.length).toBe(200);
	});

	it('does not set cost_usd or token_count', () => {
		const { sessionPatch } = computeEffects(
			makeEvent({ type: 'message_complete', text: 'hello', message_id: 'msg-1' }),
			null,
			null,
		);
		expect(sessionPatch.cost_usd).toBeUndefined();
		expect(sessionPatch.token_count).toBeUndefined();
	});
});

// ════════════════════════════════════════════════════════════════════════════
// unrelated event types (default branch)
// ════════════════════════════════════════════════════════════════════════════

describe('computeSessionEventEffects — unhandled event types', () => {
	it('returns empty patch for message_delta', () => {
		const { sessionPatch } = computeEffects(
			makeEvent({ type: 'message_delta', text: 'partial' }),
			null,
			null,
		);
		expect(sessionPatch).toEqual({});
	});

	it('returns empty patch for tool_start', () => {
		const { sessionPatch } = computeEffects(
			makeEvent({ type: 'tool_start', tool_use_id: 'tu-1', tool_name: 'bash', input: {} }),
			null,
			null,
		);
		expect(sessionPatch).toEqual({});
	});

	it('returns null notificationAction for unhandled event with no resolvedState', () => {
		const { notificationAction } = computeEffects(
			makeEvent({ type: 'message_delta', text: 'partial' }),
			null,
			null,
		);
		expect(notificationAction).toBeNull();
	});
});

// ════════════════════════════════════════════════════════════════════════════
// combined resolvedState + event effects
// ════════════════════════════════════════════════════════════════════════════

describe('computeSessionEventEffects — combined effects', () => {
	it('applies both state patch and usage data when both present', () => {
		const { sessionPatch, notificationAction } = computeEffects(
			makeEvent({
				type: 'usage_update',
				cost_usd: 0.1,
				input_tokens: 200,
				output_tokens: 100,
			}),
			'running',
			null,
		);
		expect(sessionPatch.state).toBe('running');
		expect(sessionPatch.cost_usd).toBe(0.1);
		expect(sessionPatch.token_count).toBe(300);
		expect(notificationAction).toEqual({ type: 'clear' });
	});

	it('applies notification add when needs-input + message_complete together', () => {
		const { sessionPatch, notificationAction } = computeEffects(
			makeEvent({ type: 'message_complete', text: 'Done', message_id: 'msg-2' }),
			'needs-input',
			null,
		);
		expect(sessionPatch.state).toBe('needs-input');
		expect(sessionPatch.last_response_summary).toBe('Done');
		expect(notificationAction).toEqual({ type: 'add', notificationType: 'needs-input' });
	});
});

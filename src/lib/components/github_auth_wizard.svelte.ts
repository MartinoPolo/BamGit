import type { DeviceFlowStartResult, GitHubUser } from '$lib/types/generated';

// Wizard phase state machine
export type WizardPhase =
	| { kind: 'initial'; data: DeviceFlowStartResult }
	| { kind: 'polling'; data: DeviceFlowStartResult }
	| { kind: 'success'; user: GitHubUser }
	| { kind: 'expired' }
	| {
			kind: 'error';
			errorType: 'access_denied' | 'network_error';
			message: string;
	  };

type TimerUrgency = 'normal' | 'warning' | 'danger';

export function formatRemainingTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getTimerUrgency(remainingSeconds: number): TimerUrgency {
	if (remainingSeconds <= 120) {
		return 'danger';
	}
	if (remainingSeconds <= 300) {
		return 'warning';
	}
	return 'normal';
}

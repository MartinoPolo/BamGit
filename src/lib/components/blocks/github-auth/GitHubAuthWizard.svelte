<script lang="ts">
	import { untrack } from 'svelte';
	import type { DeviceFlowStartResult, GhAuthStatus, GitHubUser } from '$lib/types/generated';
	import type { WizardPhase } from './github_auth_wizard.svelte.js';
	import { formatRemainingTime, getTimerUrgency } from './github_auth_wizard.svelte.js';
	import { invoke } from '$lib/tauri.js';
	import { MockDesktopOnlyError } from '$lib/mock_desktop_only_error.js';
	import { openUrl } from '$lib/opener.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import GithubIcon from '$lib/components/derived/icons/GithubIcon.svelte';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Clock from '@lucide/svelte/icons/clock';
	import Copy from '@lucide/svelte/icons/copy';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	interface Props {
		open: boolean;
		onconnected?: (user: GitHubUser) => void;
	}

	let { open = $bindable(), onconnected }: Props = $props();

	let phase = $state<WizardPhase | null>(null);
	let remainingSeconds = $state(0);
	let pollInterval = $state(5);
	let copied = $state(false);

	const timerUrgency = $derived(getTimerUrgency(remainingSeconds));
	const timerDisplay = $derived(formatRemainingTime(remainingSeconds));

	const timerColorClass = $derived.by(() => {
		if (timerUrgency === 'danger') {
			return 'text-status-danger';
		}
		if (timerUrgency === 'warning') {
			return 'text-status-warning';
		}
		return 'text-foreground';
	});

	let countdownTimer: ReturnType<typeof setInterval> | null = null;
	let pollTimer: ReturnType<typeof setTimeout> | null = null;
	let copyTimer: ReturnType<typeof setTimeout> | null = null;

	function clearAllTimers() {
		if (countdownTimer !== null) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}
		if (pollTimer !== null) {
			clearTimeout(pollTimer);
			pollTimer = null;
		}
		if (copyTimer !== null) {
			clearTimeout(copyTimer);
			copyTimer = null;
		}
	}

	async function startDeviceFlow() {
		try {
			const result = await invoke<DeviceFlowStartResult>('github_device_flow_start');
			phase = { kind: 'polling', data: result };
			remainingSeconds = result.expires_in;
			pollInterval = result.interval;
			startCountdown();
			schedulePoll();
		} catch (error) {
			if (error instanceof MockDesktopOnlyError) {
				handleClose();
				return;
			}
			phase = {
				kind: 'error',
				errorType: 'network_error',
				message: String(error),
			};
		}
	}

	function startCountdown() {
		if (countdownTimer !== null) {
			clearInterval(countdownTimer);
		}
		countdownTimer = setInterval(() => {
			remainingSeconds -= 1;
			if (remainingSeconds <= 0) {
				remainingSeconds = 0;
				clearAllTimers();
				phase = { kind: 'expired' };
			}
		}, 1000);
	}

	async function handleOpenGitHub() {
		if (phase === null || phase.kind !== 'polling') {
			return;
		}
		await openUrl(phase.data.verification_uri);
	}

	function schedulePoll() {
		if (pollTimer !== null) {
			clearTimeout(pollTimer);
		}
		pollTimer = setTimeout(() => {
			void doPoll();
		}, pollInterval * 1000);
	}

	// fallow-ignore-next-line complexity
	async function doPoll() {
		if (phase === null || phase.kind !== 'polling') {
			return;
		}

		try {
			const result = await invoke<GhAuthStatus>('github_device_flow_poll', {
				deviceCode: phase.data.device_code,
			});

			clearAllTimers();

			if (result.status === 'oauth-connected') {
				phase = { kind: 'success', user: result.user };
				onconnected?.(result.user);
			} else {
				phase = {
					kind: 'error',
					errorType: 'network_error',
					message: 'Unexpected authentication status',
				};
			}
		} catch (error) {
			const errorMessage = String(error);

			if (errorMessage.includes('authorization_pending')) {
				schedulePoll();
				return;
			}
			if (errorMessage.includes('slow_down')) {
				pollInterval += 5;
				schedulePoll();
				return;
			}
			if (errorMessage.includes('expired_token')) {
				clearAllTimers();
				phase = { kind: 'expired' };
				return;
			}
			if (errorMessage.includes('access_denied')) {
				clearAllTimers();
				phase = {
					kind: 'error',
					errorType: 'access_denied',
					message: 'You denied the authorization request.',
				};
				return;
			}

			clearAllTimers();
			phase = {
				kind: 'error',
				errorType: 'network_error',
				message: errorMessage,
			};
		}
	}

	async function handleCopyCode() {
		if (phase === null || phase.kind !== 'polling') {
			return;
		}
		try {
			await navigator.clipboard.writeText(phase.data.user_code);
			copied = true;
			if (copyTimer !== null) {
				clearTimeout(copyTimer);
			}
			copyTimer = setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Clipboard API may not be available
		}
	}

	async function handleGetNewCode() {
		clearAllTimers();
		await startDeviceFlow();
	}

	function handleClose() {
		clearAllTimers();
		phase = null;
		copied = false;
		remainingSeconds = 0;
		open = false;
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			handleClose();
		}
	}

	$effect(() => {
		if (open && untrack(() => phase) === null) {
			void startDeviceFlow();
		}

		return () => {
			clearAllTimers();
		};
	});
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<div class="flex items-center gap-2">
				<GithubIcon size={20} />
				<Dialog.Title>Connect GitHub</Dialog.Title>
			</div>
		</Dialog.Header>

		<Dialog.Body class="flex flex-col items-center gap-4">
			{#if phase === null}
				<div class="flex items-center justify-center py-8">
					<Loader2 size={24} class="animate-spin text-muted-foreground" />
				</div>
			{:else if phase.kind === 'polling'}
				<p class="text-center text-sm text-muted-foreground">
					Copy this code and enter it on GitHub to connect your account.
				</p>

				<!-- User code display -->
				<button
					onclick={handleCopyCode}
					class="group relative flex w-full cursor-pointer items-center justify-center rounded-lg border bg-muted/30 px-5 py-3.5 transition-colors hover:bg-muted/50"
				>
					<span class="font-mono text-4xl font-semibold tracking-widest">
						{phase.data.user_code}
					</span>
					<span
						class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
					>
						{#if copied}
							<CheckCircle2 size={16} class="text-green-500" />
						{:else}
							<Copy size={16} />
						{/if}
					</span>
				</button>

				{#if copied}
					<p class="text-xs text-green-500">Copied to clipboard!</p>
				{/if}

				<!-- Timer -->
				<div class="flex items-center gap-1.5">
					<Clock size={14} class={timerColorClass} />
					<span class="font-mono text-sm tabular-nums {timerColorClass}">
						{timerDisplay}
					</span>
				</div>

				<!-- Verification URL -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub link -->
				<a
					href={phase.data.verification_uri}
					class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
					target="_blank"
					rel="noopener noreferrer"
				>
					{phase.data.verification_uri}
					<ExternalLink size={10} />
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->

				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 size={14} class="animate-spin" />
					<span>Waiting for authorization...</span>
				</div>
			{:else if phase.kind === 'expired'}
				<div class="flex flex-col items-center gap-3 py-4">
					<Clock size={32} class="text-status-warning" />
					<p class="text-center text-sm font-medium">Code expired</p>
					<p class="text-center text-xs text-muted-foreground">
						The authorization code has expired. Request a new one to continue.
					</p>
				</div>
			{:else if phase.kind === 'success'}
				<div class="flex flex-col items-center gap-3 py-4">
					<CheckCircle2 size={32} class="text-green-500" />
					{#if phase.user.avatar_url}
						<img
							src={phase.user.avatar_url}
							alt="{phase.user.login}'s avatar"
							class="size-16 rounded-full border-2 border-border"
						/>
					{/if}
					<div class="text-center">
						<p class="text-sm font-medium">Connected as {phase.user.login}</p>
						<p class="text-xs text-muted-foreground">
							Your GitHub account is now linked.
						</p>
					</div>
				</div>
			{:else if phase.kind === 'error'}
				<div class="flex flex-col items-center gap-3 py-4">
					<AlertCircle size={32} class="text-status-danger" />
					<p class="text-center text-sm font-medium">Authentication failed</p>
					<p class="text-center text-xs text-muted-foreground">
						{phase.message}
					</p>
				</div>
			{/if}
		</Dialog.Body>

		<Dialog.Footer>
			{#if phase === null}
				<Button variant="ghost" onclick={handleClose}>Cancel</Button>
			{:else if phase.kind === 'polling'}
				<Button variant="ghost" onclick={handleClose}>Cancel</Button>
				<Button onclick={handleOpenGitHub}>
					<ExternalLink size={14} />
					Open GitHub
				</Button>
			{:else if phase.kind === 'expired'}
				<Button variant="ghost" onclick={handleClose}>Cancel</Button>
				<Button onclick={handleGetNewCode}>Get New Code</Button>
			{:else if phase.kind === 'success'}
				<Button onclick={handleClose}>Done</Button>
			{:else if phase.kind === 'error'}
				<Button variant="ghost" onclick={handleClose}>Cancel</Button>
				<Button onclick={handleGetNewCode}>Try Again</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

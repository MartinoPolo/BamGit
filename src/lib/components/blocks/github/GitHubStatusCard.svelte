<script lang="ts">
	import type { GhAuthStatus, GhCliAvailability } from '$lib/types/generated';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import GithubIcon from '$lib/components/derived/icons/GithubIcon.svelte';
	import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Terminal from '@lucide/svelte/icons/terminal';
	import KeyRound from '@lucide/svelte/icons/key-round';

	interface Props {
		authStatus: GhAuthStatus;
		ghAvailability: GhCliAvailability;
		onconnect?: () => void;
		ondisconnect?: () => void;
		borderless?: boolean;
	}

	let {
		authStatus,
		ghAvailability,
		onconnect,
		ondisconnect,
		borderless = false,
	}: Props = $props();

	const oauthConnected = $derived(authStatus.status === 'oauth-connected');
	const cliConnected = $derived(
		authStatus.status === 'cli-connected' || ghAvailability === 'available',
	);
	const fullyDisconnected = $derived(!oauthConnected && !cliConnected);
</script>

<div class={borderless ? '' : 'rounded-lg border bg-surface-1 p-4'}>
	<div class="mb-3 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<GithubIcon size={18} />
			<span class="text-sm font-medium">GitHub</span>
		</div>
		{#if fullyDisconnected}
			<Badge variant="danger" size="compact">Not connected</Badge>
		{:else if oauthConnected}
			<Badge variant="success" size="compact">Connected</Badge>
		{:else}
			<Badge variant="warning" size="compact">CLI only</Badge>
		{/if}
	</div>

	<div class="flex flex-col gap-2">
		<!-- OAuth status row -->
		<div class="flex items-center justify-between gap-2 text-xs">
			<div class="flex items-center gap-2">
				<KeyRound size={13} class="text-muted-foreground" />
				{#if oauthConnected && authStatus.status === 'oauth-connected'}
					<div class="flex items-center gap-2">
						<img
							src={authStatus.user.avatar_url}
							alt="{authStatus.user.login}'s avatar"
							class="size-5 rounded-full border"
						/>
						<span class="font-medium">{authStatus.user.login}</span>
						<Badge variant="moss" size="compact">OAuth</Badge>
					</div>
				{:else}
					<span class="text-muted-foreground">OAuth not connected</span>
				{/if}
			</div>
			{#if oauthConnected && ondisconnect}
				<Button variant="ghost" size="sm" class="h-6 text-xs" onclick={ondisconnect}>
					Disconnect
				</Button>
			{:else if !oauthConnected && onconnect}
				<Button variant="secondary" size="sm" class="h-6 text-xs" onclick={onconnect}>
					Connect
				</Button>
			{/if}
		</div>

		<!-- CLI status row -->
		<div class="flex items-center gap-2 text-xs">
			<Terminal size={13} class="text-muted-foreground" />
			{#if ghAvailability === 'available'}
				<div class="flex items-center gap-1.5">
					<CircleCheckBig size={12} class="text-status-success" />
					<span>gh CLI authenticated</span>
				</div>
			{:else if ghAvailability === 'not-authenticated'}
				<div class="flex items-center gap-1.5">
					<CircleAlert size={12} class="text-status-warning" />
					<span class="text-muted-foreground">gh CLI installed but not authenticated</span
					>
				</div>
			{:else}
				<div class="flex items-center gap-1.5">
					<CircleAlert size={12} class="text-muted-foreground" />
					<span class="text-muted-foreground">gh CLI not installed</span>
				</div>
			{/if}
		</div>
	</div>
</div>

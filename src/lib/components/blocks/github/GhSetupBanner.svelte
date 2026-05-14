<script lang="ts">
	import type { GhAuthStatus } from '$lib/types/generated';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import GithubIcon from '$lib/components/derived/icons/GithubIcon.svelte';

	interface Props {
		authStatus: GhAuthStatus;
		onconnect?: () => void;
	}

	let { authStatus, onconnect }: Props = $props();
</script>

{#if authStatus.status === 'not-connected'}
	<div
		class="flex items-center gap-2 rounded border border-[color-mix(in_oklch,var(--status-warning)_50%,transparent)] bg-[color-mix(in_oklch,var(--status-warning)_14%,transparent)] px-3 py-2 text-xs text-status-warning"
	>
		<AlertTriangle size={14} />
		<span class="flex-1">Connect your GitHub account to sync issues, PRs, and branches.</span>
		{#if onconnect}
			<Button intent="secondary" size="sm" onclick={onconnect}>
				<GithubIcon data-icon="inline-start" />
				Connect to GitHub
			</Button>
		{/if}
	</div>
{/if}

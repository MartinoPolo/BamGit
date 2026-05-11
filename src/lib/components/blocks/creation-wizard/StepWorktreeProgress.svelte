<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { WorktreeState } from '$lib/modules/issues';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleX from '@lucide/svelte/icons/circle-x';

	interface Props {
		worktreeState: WorktreeState;
		onRetry: () => void;
		onClose: () => void;
	}

	let { worktreeState, onRetry, onClose }: Props = $props();
</script>

<div class="flex flex-col items-center gap-4 py-4">
	{#if worktreeState === 'pending'}
		<Loader2 size={32} class="animate-spin text-muted-foreground" />
		<p class="text-sm text-muted-foreground">{m.wizard_progress_pending()}</p>
	{:else if worktreeState === 'active'}
		<CircleCheck size={32} class="text-status-success" />
		<p class="text-sm text-status-success">{m.wizard_progress_active()}</p>
		<Button variant="ghost" size="sm" onclick={onClose}>OK</Button>
	{:else if worktreeState === 'failed'}
		<CircleX size={32} class="text-status-danger" />
		<p class="text-sm text-status-danger">{m.wizard_progress_failed()}</p>
		<Button variant="ghost" size="sm" onclick={onRetry}>{m.wizard_retry()}</Button>
	{/if}
</div>

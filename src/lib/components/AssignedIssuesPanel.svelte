<script lang="ts">
	import type { AssignedIssue } from '$lib/types/generated';
	import { CircleDot, CircleCheck } from 'lucide-svelte';
	import { openUrl } from '@tauri-apps/plugin-opener';

	interface Props {
		issues: AssignedIssue[];
		disabled?: boolean;
	}

	let { issues, disabled = false }: Props = $props();

	async function handleClick(url: string) {
		if (!disabled) {
			await openUrl(url);
		}
	}
</script>

{#if issues.length > 0}
	<div class="flex flex-col gap-1">
		<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
			Assigned to me ({issues.length})
		</h3>
		<div class="flex flex-col gap-0.5">
			{#each issues as issue (issue.number)}
				<button
					onclick={() => handleClick(issue.url)}
					class="flex items-center gap-2 rounded px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					class:cursor-not-allowed={disabled}
					class:opacity-50={disabled}
					{disabled}
				>
					{#if issue.state === 'OPEN'}
						<CircleDot size={12} class="shrink-0 text-green-400" />
					{:else}
						<CircleCheck size={12} class="shrink-0 text-purple-400" />
					{/if}
					<span class="min-w-0 truncate">#{issue.number} {issue.title}</span>
				</button>
			{/each}
		</div>
	</div>
{/if}

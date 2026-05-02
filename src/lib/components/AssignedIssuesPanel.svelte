<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { AssignedIssue } from '$lib/types/generated';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Plus from '@lucide/svelte/icons/plus';
	import { openUrl } from '@tauri-apps/plugin-opener';

	interface Props {
		issues: AssignedIssue[];
		disabled?: boolean;
		onQuickAdd?: (issue: AssignedIssue) => void;
	}

	let { issues, disabled = false, onQuickAdd }: Props = $props();

	async function handleClick(url: string) {
		if (!disabled) {
			await openUrl(url);
		}
	}
</script>

{#if issues.length > 0}
	<div class="flex flex-col gap-1">
		<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
			{m.assigned_title({ count: issues.length })}
		</h3>
		<div class="flex flex-col gap-0.5">
			{#each issues as issue (issue.number)}
				<div class="group flex items-center gap-0.5">
					<button
						onclick={() => handleClick(issue.url)}
						class="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
					{#if onQuickAdd}
						<button
							type="button"
							onclick={() => onQuickAdd(issue)}
							class="shrink-0 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
							title={m.wizard_quick_add()}
						>
							<Plus size={12} />
						</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

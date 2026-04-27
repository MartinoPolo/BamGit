<script lang="ts">
	import type { Issue, UpdateIssueRequest } from '$lib/modules/issues/index.svelte.js';
	import { FALLBACK_ISSUE_COLOR } from '$lib/modules/board/index.svelte.js';
	import PaletteColorPicker from './PaletteColorPicker.svelte';

	interface Props {
		issue: Issue | null;
		paletteColors: string[];
		onClose: () => void;
		onUpdate: (request: UpdateIssueRequest) => void;
	}

	let { issue, paletteColors, onClose, onUpdate }: Props = $props();

	let name = $state('');
	let priority = $state<string>('');
	let color = $state('');
	let githubIssueUrl = $state('');
	let dialogElement: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (issue !== null && dialogElement !== undefined && !dialogElement.open) {
			name = issue.name;
			priority = issue.priority ?? '';
			color = issue.color ?? paletteColors[0] ?? FALLBACK_ISSUE_COLOR;
			githubIssueUrl = issue.github_issue_url ?? '';
			dialogElement.showModal();
		} else if (issue === null && dialogElement?.open === true) {
			dialogElement.close();
		}
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (issue === null || !name.trim()) {
			return;
		}

		const request: UpdateIssueRequest = {
			id: issue.id,
			name: name.trim(),
			priority: (priority as 'low' | 'medium' | 'high' | 'top') || null,
			color: color || null,
			github_issue_url: githubIssueUrl.trim() || null,
		};

		onUpdate(request);
		onClose();
	}
</script>

<dialog
	bind:this={dialogElement}
	onclose={onClose}
	class="w-full max-w-md rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/50"
>
	{#if issue}
		<form onsubmit={handleSubmit} class="flex flex-col gap-4 p-6">
			<h2 class="text-lg font-semibold">Edit Issue</h2>

			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Name *</span>
				<input
					bind:value={name}
					required
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
				/>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Priority</span>
				<select
					bind:value={priority}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
				>
					<option value="">None</option>
					<option value="low">Low</option>
					<option value="medium">Medium</option>
					<option value="high">High</option>
					<option value="top">Top</option>
				</select>
			</label>

			<PaletteColorPicker
				colors={paletteColors}
				selectedColor={color}
				onSelect={(c) => (color = c)}
			/>

			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">GitHub Issue URL</span>
				<input
					bind:value={githubIssueUrl}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
				/>
			</label>

			<div class="flex justify-end gap-2 pt-2">
				<button
					type="button"
					onclick={onClose}
					class="rounded px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Save
				</button>
			</div>
		</form>
	{/if}
</dialog>

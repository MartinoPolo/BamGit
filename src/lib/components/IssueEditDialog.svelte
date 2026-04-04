<script lang="ts">
	import type { Issue, UpdateIssueRequest } from '$lib/types/issue';
	import { FALLBACK_ISSUE_COLOR } from '$lib/types/color_palette';
	import PaletteColorPicker from './PaletteColorPicker.svelte';

	interface Props {
		issue: Issue | null;
		palette_colors: string[];
		on_close: () => void;
		on_update: (request: UpdateIssueRequest) => void;
	}

	let { issue, palette_colors, on_close, on_update }: Props = $props();

	let name = $state('');
	let priority = $state<string>('');
	let color = $state('');
	let github_issue_url = $state('');
	let dialog_element: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (issue !== null && dialog_element !== undefined && !dialog_element.open) {
			name = issue.name;
			priority = issue.priority ?? '';
			color = issue.color ?? palette_colors[0] ?? FALLBACK_ISSUE_COLOR;
			github_issue_url = issue.github_issue_url ?? '';
			dialog_element.showModal();
		} else if (issue === null && dialog_element?.open === true) {
			dialog_element.close();
		}
	});

	function handle_submit(event: SubmitEvent) {
		event.preventDefault();
		if (issue === null || !name.trim()) {
			return;
		}

		const request: UpdateIssueRequest = {
			id: issue.id,
			name: name.trim(),
			priority: (priority as 'low' | 'medium' | 'high' | 'top') || null,
			color: color || null,
			github_issue_url: github_issue_url.trim() || null,
		};

		on_update(request);
		on_close();
	}
</script>

<dialog
	bind:this={dialog_element}
	onclose={on_close}
	class="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 p-0 text-neutral-100 shadow-xl backdrop:bg-black/50"
>
	{#if issue}
		<form onsubmit={handle_submit} class="flex flex-col gap-4 p-6">
			<h2 class="text-lg font-semibold">Edit Issue</h2>

			<label class="flex flex-col gap-1">
				<span class="text-xs text-neutral-400">Name *</span>
				<input
					bind:value={name}
					required
					class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
				/>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-xs text-neutral-400">Priority</span>
				<select
					bind:value={priority}
					class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
				>
					<option value="">None</option>
					<option value="low">Low</option>
					<option value="medium">Medium</option>
					<option value="high">High</option>
					<option value="top">Top</option>
				</select>
			</label>

			<PaletteColorPicker
				colors={palette_colors}
				selected_color={color}
				on_select={(c) => (color = c)}
			/>

			<label class="flex flex-col gap-1">
				<span class="text-xs text-neutral-400">GitHub Issue URL</span>
				<input
					bind:value={github_issue_url}
					class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
				/>
			</label>

			<div class="flex justify-end gap-2 pt-2">
				<button
					type="button"
					onclick={on_close}
					class="rounded px-4 py-2 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500"
				>
					Save
				</button>
			</div>
		</form>
	{/if}
</dialog>

<script lang="ts">
	import type { CreateIssueRequest } from '$lib/types/issue';
	import PaletteColorPicker from './PaletteColorPicker.svelte';

	interface Props {
		open: boolean;
		dashboard_id: string;
		palette_colors: string[];
		default_color: string;
		on_close: () => void;
		on_create: (request: CreateIssueRequest) => void;
	}

	let { open, dashboard_id, palette_colors, default_color, on_close, on_create }: Props =
		$props();

	let name = $state('');
	let priority = $state<'low' | 'medium' | 'high' | 'top' | ''>('');
	let color = $state('');
	let github_issue_url = $state('');
	let dialog_element: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (open && dialog_element !== undefined && !dialog_element.open) {
			color = default_color;
			dialog_element.showModal();
		} else if (!open && dialog_element?.open === true) {
			dialog_element.close();
		}
	});

	function reset_form() {
		name = '';
		priority = '';
		color = '';
		github_issue_url = '';
	}

	function handle_submit(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim()) {
			return;
		}

		const request: CreateIssueRequest = {
			dashboard_id,
			name: name.trim(),
			color,
		};

		if (priority) {
			request.priority = priority;
		}
		if (github_issue_url.trim()) {
			request.github_issue_url = github_issue_url.trim();
			const issue_number_match = github_issue_url.match(/\/issues\/(\d+)/);
			if (issue_number_match) {
				request.github_issue_number = parseInt(issue_number_match[1], 10);
			}
		}

		on_create(request);
		reset_form();
		on_close();
	}

	function handle_cancel() {
		reset_form();
		on_close();
	}
</script>

<dialog
	bind:this={dialog_element}
	onclose={handle_cancel}
	class="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 p-0 text-neutral-100 shadow-xl backdrop:bg-black/50"
>
	<form onsubmit={handle_submit} class="flex flex-col gap-4 p-6">
		<h2 class="text-lg font-semibold">Create Issue</h2>

		<label class="flex flex-col gap-1">
			<span class="text-xs text-neutral-400">Name *</span>
			<input
				bind:value={name}
				required
				class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
				placeholder="Issue name"
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

		<!-- Color picker -->
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
				placeholder="https://github.com/owner/repo/issues/42"
			/>
		</label>

		<div class="flex justify-end gap-2 pt-2">
			<button
				type="button"
				onclick={handle_cancel}
				class="rounded px-4 py-2 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
			>
				Cancel
			</button>
			<button
				type="submit"
				class="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500"
			>
				Create
			</button>
		</div>
	</form>
</dialog>

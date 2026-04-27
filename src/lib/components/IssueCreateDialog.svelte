<script lang="ts">
	import type { CreateIssueRequest } from '$lib/modules/issues';
	import PaletteColorPicker from './PaletteColorPicker.svelte';
	import { syncDialogVisibility, buildCreateIssueRequest } from './dialog_helpers.js';

	interface Props {
		open: boolean;
		dashboardId: string;
		paletteColors: string[];
		defaultColor: string;
		onClose: () => void;
		onCreate: (request: CreateIssueRequest) => void;
	}

	let { open, dashboardId, paletteColors, defaultColor, onClose, onCreate }: Props = $props();

	let name = $state('');
	let priority = $state<'low' | 'medium' | 'high' | 'top' | ''>('');
	let color = $state('');
	let githubIssueUrl = $state('');
	let dialogElement: HTMLDialogElement | undefined = $state();

	$effect(() => {
		syncDialogVisibility(open, dialogElement, () => {
			color = defaultColor;
		});
	});

	function resetForm() {
		name = '';
		priority = '';
		color = '';
		githubIssueUrl = '';
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const request = buildCreateIssueRequest(dashboardId, name, color, priority, githubIssueUrl);
		if (request === null) {
			return;
		}
		onCreate(request);
		resetForm();
		onClose();
	}

	function handleCancel() {
		resetForm();
		onClose();
	}
</script>

<dialog
	bind:this={dialogElement}
	onclose={handleCancel}
	class="w-full max-w-md rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/50"
>
	<form onsubmit={handleSubmit} class="flex flex-col gap-4 p-6">
		<h2 class="text-lg font-semibold">Create Issue</h2>

		<label class="flex flex-col gap-1">
			<span class="text-xs text-muted-foreground">Name *</span>
			<input
				bind:value={name}
				required
				class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
				placeholder="Issue name"
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

		<!-- Color picker -->
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
				placeholder="https://github.com/owner/repo/issues/42"
			/>
		</label>

		<div class="flex justify-end gap-2 pt-2">
			<button
				type="button"
				onclick={handleCancel}
				class="rounded px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				Cancel
			</button>
			<button
				type="submit"
				class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
			>
				Create
			</button>
		</div>
	</form>
</dialog>

<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { CreateIssueRequest } from '$lib/modules/issues';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Select } from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PaletteColorPicker from './PaletteColorPicker.svelte';
	import { buildCreateIssueRequest } from './dialog_helpers.js';

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

	$effect(() => {
		if (open) {
			color = defaultColor;
		}
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

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			handleCancel();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<Dialog.Header>
				<Dialog.Title>{m.issue_create_title()}</Dialog.Title>
			</Dialog.Header>

			<Dialog.Body class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<Label for="issue-name">{m.issue_field_name()}</Label>
					<Input
						id="issue-name"
						bind:value={name}
						required
						placeholder={m.issue_placeholder_name()}
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<Label for="issue-priority">{m.issue_field_priority()}</Label>
					<Select id="issue-priority" bind:value={priority}>
						<option value="">{m.priority_none()}</option>
						<option value="low">{m.priority_low()}</option>
						<option value="medium">{m.priority_medium()}</option>
						<option value="high">{m.priority_high()}</option>
						<option value="top">{m.priority_top()}</option>
					</Select>
				</div>

				<PaletteColorPicker
					colors={paletteColors}
					selectedColor={color}
					onSelect={(c) => (color = c)}
				/>

				<div class="flex flex-col gap-1.5">
					<Label for="issue-github-url">{m.issue_field_github_url()}</Label>
					<Input
						id="issue-github-url"
						bind:value={githubIssueUrl}
						placeholder={m.issue_placeholder_github_url()}
					/>
				</div>
			</Dialog.Body>

			<Dialog.Footer>
				<Button variant="ghost" type="button" onclick={handleCancel}>
					{m.btn_cancel()}
				</Button>
				<Button type="submit">
					{m.btn_create()}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

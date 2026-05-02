<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue, UpdateIssueRequest } from '$lib/modules/issues';
	import { FALLBACK_ISSUE_COLOR } from '$lib/modules/board';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Select } from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ColorPicker } from './color-picker/index.js';
	import { buildUpdateIssueRequest } from './dialog_helpers.js';

	interface Props {
		issue: Issue | null;
		paletteColors: string[];
		usedColors?: string[];
		isDarkMode?: boolean;
		onClose: () => void;
		onUpdate: (request: UpdateIssueRequest) => void;
	}

	let {
		issue,
		paletteColors,
		usedColors = [],
		isDarkMode = false,
		onClose,
		onUpdate,
	}: Props = $props();

	let name = $state('');
	let priority = $state<string>('');
	let color = $state('');
	let githubIssueUrl = $state('');

	const open = $derived(issue !== null);

	const editUsedColors = $derived(
		issue?.color != null
			? usedColors.filter((c) => c.toLowerCase() !== issue!.color!.toLowerCase())
			: usedColors,
	);

	$effect(() => {
		if (issue !== null) {
			name = issue.name;
			priority = issue.priority ?? '';
			color = issue.color ?? paletteColors[0] ?? FALLBACK_ISSUE_COLOR;
			githubIssueUrl = issue.github_issue_url ?? '';
		}
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const request = buildUpdateIssueRequest(
			issue?.id ?? null,
			name,
			priority,
			color,
			githubIssueUrl,
		);
		if (request === null) {
			return;
		}
		onUpdate(request);
		onClose();
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClose();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		{#if issue}
			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<Dialog.Header>
					<Dialog.Title>{m.issue_edit_title()}</Dialog.Title>
				</Dialog.Header>

				<Dialog.Body class="flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<Label for="edit-issue-name">{m.issue_field_name()}</Label>
						<Input id="edit-issue-name" bind:value={name} required />
					</div>

					<div class="flex flex-col gap-1.5">
						<Label for="edit-issue-priority">{m.issue_field_priority()}</Label>
						<Select id="edit-issue-priority" bind:value={priority}>
							<option value="">{m.priority_none()}</option>
							<option value="lowest">{m.priority_lowest()}</option>
							<option value="low">{m.priority_low()}</option>
							<option value="medium">{m.priority_medium()}</option>
							<option value="high">{m.priority_high()}</option>
							<option value="top">{m.priority_top()}</option>
						</Select>
					</div>

					<ColorPicker
						variant="palette-hex-native"
						colors={paletteColors}
						selectedColor={color}
						usedColors={editUsedColors}
						{isDarkMode}
						onSelect={(c) => {
							if (c === '') {
								color = issue?.color ?? paletteColors[0] ?? FALLBACK_ISSUE_COLOR;
							} else {
								color = c;
							}
						}}
					/>

					<div class="flex flex-col gap-1.5">
						<Label for="edit-issue-github-url">{m.issue_field_github_url()}</Label>
						<Input id="edit-issue-github-url" bind:value={githubIssueUrl} />
					</div>
				</Dialog.Body>

				<Dialog.Footer>
					<Button variant="ghost" type="button" onclick={onClose}>
						{m.btn_cancel()}
					</Button>
					<Button type="submit">
						{m.btn_save()}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

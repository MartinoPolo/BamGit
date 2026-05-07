<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { useRawRequirements } from '$lib/modules/raw-requirements/index.js';
	import type { RawRequirementNote } from '$lib/modules/raw-requirements/index.js';

	interface Props {
		note: RawRequirementNote;
		index: number;
		showToggleProcessed?: boolean;
	}

	let { note, index, showToggleProcessed = false }: Props = $props();

	const rawRequirementsCtx = useRawRequirements();

	let editContent = $state('');

	const isEditing = $derived(rawRequirementsCtx.editingIndex === index);

	function startEditing() {
		if (index < 0 || index >= rawRequirementsCtx.notes.length) {
			return;
		}
		rawRequirementsCtx.editingIndex = index;
		editContent = rawRequirementsCtx.notes[index].content;
	}

	function cancelEditing() {
		rawRequirementsCtx.editingIndex = null;
		editContent = '';
	}

	async function saveEdit() {
		await rawRequirementsCtx.updateNote(index, editContent);
		editContent = '';
	}

	function handleEditKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void saveEdit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEditing();
		}
	}
</script>

<div class="group rounded-lg border border-border p-3">
	<div class="mb-1 flex items-center justify-between">
		<span class="text-xs text-muted-foreground">
			{note.timestamp}
		</span>
		<div class="flex items-center gap-1">
			{#if note.processed}
				<Badge variant="default" class="text-[length:var(--text-2xs)]">
					{m.raw_requirements_processed()}
				</Badge>
			{/if}
			{#if !isEditing}
				<Button
					variant="ghost"
					size="icon-sm"
					class="opacity-0 transition-opacity group-hover:opacity-100"
					onclick={startEditing}
				>
					<PencilIcon />
					<span class="sr-only">{m.raw_requirements_edit()}</span>
				</Button>
				{#if showToggleProcessed}
					<Button
						variant="ghost"
						size="icon-sm"
						class="opacity-0 transition-opacity group-hover:opacity-100"
						onclick={() => void rawRequirementsCtx.toggleProcessed(index)}
					>
						<CircleCheckIcon />
						<span class="sr-only">{m.raw_requirements_toggle_processed()}</span>
					</Button>
				{/if}
			{/if}
		</div>
	</div>

	{#if isEditing}
		<Textarea
			class="min-h-[60px] text-sm"
			value={editContent}
			oninput={(event) => {
				editContent = event.currentTarget.value;
			}}
			onkeydown={handleEditKeydown}
		/>
		<div class="mt-2 flex justify-end gap-1">
			<Button variant="ghost" size="sm" onclick={cancelEditing}>
				<XIcon />
				{m.raw_requirements_cancel_edit()}
			</Button>
			<Button variant="primary" size="sm" onclick={() => void saveEdit()}>
				<CheckIcon />
				{m.raw_requirements_save_edit()}
			</Button>
		</div>
	{:else}
		<p class="whitespace-pre-wrap text-sm text-muted-foreground">
			{note.content}
		</p>
	{/if}
</div>

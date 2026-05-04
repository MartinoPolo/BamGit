<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { onMount } from 'svelte';
	import { useCreationWizard } from '$lib/modules/creation-wizard';
	import { generateBranchName } from '$lib/modules/creation-wizard';

	const wizard = useCreationWizard();

	let nameValue = $state(wizard.formData.issueName);
	let inputElement = $state<HTMLInputElement | null>(null);

	const branchPreview = $derived.by(() => {
		if (wizard.formData.githubIssueNumber !== null) {
			return generateBranchName(wizard.formData.githubIssueNumber, nameValue);
		}
		return '';
	});

	onMount(() => {
		if (inputElement) {
			inputElement.focus();
			inputElement.selectionStart = inputElement.value.length;
			inputElement.selectionEnd = inputElement.value.length;
		}
	});

	export function confirm() {
		const trimmed = nameValue.trim();
		if (trimmed) {
			wizard.confirmIssueName(trimmed, branchPreview);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			confirm();
		}
	}
</script>

<div class="flex flex-col gap-3">
	<Input
		id="wizard-issue-name"
		bind:ref={inputElement}
		bind:value={nameValue}
		placeholder={m.wizard_name_placeholder()}
		onkeydown={handleKeydown}
	/>
	{#if branchPreview}
		<p class="text-xs text-muted-foreground">
			{m.wizard_branch_preview({ branch: branchPreview })}
		</p>
	{/if}
</div>

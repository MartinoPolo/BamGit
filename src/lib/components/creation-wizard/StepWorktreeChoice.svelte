<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { onMount } from 'svelte';
	import { useCreationWizard } from '$lib/modules/creation-wizard';
	import TreePine from '@lucide/svelte/icons/tree-pine';
	import X from '@lucide/svelte/icons/x';

	const wizard = useCreationWizard();

	onMount(() => {
		requestAnimationFrame(() => {
			if (document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
		});
	});

	let selectedChoice = $state<boolean>(true);

	export function confirm() {
		wizard.selectWorktreeChoice(selectedChoice);
	}

	export function toggleChoice() {
		selectedChoice = !selectedChoice;
	}

	function handleClick(choice: boolean) {
		selectedChoice = choice;
		wizard.selectWorktreeChoice(choice);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			confirm();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col gap-4" onkeydown={handleKeydown}>
	<div class="flex items-center justify-center gap-4">
		<button
			type="button"
			onclick={() => handleClick(true)}
			class="flex size-24 flex-col items-center justify-center gap-2 rounded-lg border-2 transition-colors
				{selectedChoice === true
				? 'border-status-success bg-[color-mix(in_oklch,var(--status-success)_14%,transparent)] text-status-success'
				: 'border-border bg-transparent text-muted-foreground hover:bg-surface-hover'}"
		>
			<TreePine size={24} />
			<span class="text-xs font-medium">{m.wizard_worktree_yes()}</span>
		</button>
		<button
			type="button"
			onclick={() => handleClick(false)}
			class="flex size-24 flex-col items-center justify-center gap-2 rounded-lg border-2 transition-colors
				{selectedChoice === false
				? 'border-status-danger bg-[color-mix(in_oklch,var(--status-danger)_14%,transparent)] text-status-danger'
				: 'border-border bg-transparent text-muted-foreground hover:bg-surface-hover'}"
		>
			<X size={24} />
			<span class="text-xs font-medium">{m.wizard_worktree_no()}</span>
		</button>
	</div>
</div>

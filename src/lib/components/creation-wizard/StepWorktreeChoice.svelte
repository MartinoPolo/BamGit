<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useCreationWizard } from '$lib/modules/creation-wizard';
	import TreePine from '@lucide/svelte/icons/tree-pine';
	import X from '@lucide/svelte/icons/x';

	const wizard = useCreationWizard();

	let selectedChoice = $state<boolean>(true);

	export function confirm() {
		wizard.selectWorktreeChoice(selectedChoice);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			event.preventDefault();
			selectedChoice = !selectedChoice;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			confirm();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col gap-4" onkeydown={handleKeydown}>
	<p class="text-center text-sm font-medium text-foreground">
		{m.wizard_step_worktree()}
	</p>
	<div class="flex items-center justify-center gap-4">
		<button
			type="button"
			onclick={() => wizard.selectWorktreeChoice(true)}
			class="flex flex-col items-center gap-2 rounded-lg border-2 px-6 py-4 transition-colors
				{selectedChoice === true
				? 'border-green-500 bg-green-500/10 text-green-400'
				: 'border-border bg-transparent text-muted-foreground hover:bg-surface-hover'}"
		>
			<TreePine size={24} />
			<span class="text-xs font-medium">{m.wizard_worktree_yes()}</span>
		</button>
		<button
			type="button"
			onclick={() => wizard.selectWorktreeChoice(false)}
			class="flex flex-col items-center gap-2 rounded-lg border-2 px-6 py-4 transition-colors
				{selectedChoice === false
				? 'border-red-500 bg-red-500/10 text-red-400'
				: 'border-border bg-transparent text-muted-foreground hover:bg-surface-hover'}"
		>
			<X size={24} />
			<span class="text-xs font-medium">{m.wizard_worktree_no()}</span>
		</button>
	</div>
</div>

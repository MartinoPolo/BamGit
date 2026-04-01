<script lang="ts">
	interface Props {
		on_add_issue: () => void;
	}

	let { on_add_issue }: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 py-12 text-center">
	<p class="text-neutral-400">No issues yet</p>
	<button
		onclick={on_add_issue}
		class="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500"
	>
		+ Add Issue
	</button>
	<p class="text-xs text-neutral-600">
		Create issues manually or quick-add from assigned GitHub issues.
	</p>
</div>

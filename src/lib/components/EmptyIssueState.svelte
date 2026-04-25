<script lang="ts">
	interface Props {
		onAddIssue: () => void;
	}

	let { onAddIssue }: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 py-12 text-center">
	<p class="text-muted-foreground">No issues yet</p>
	<button
		onclick={onAddIssue}
		class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
	>
		+ Add Issue
	</button>
	<p class="text-xs text-muted-foreground/60">
		Create issues manually or quick-add from assigned GitHub issues.
	</p>
</div>

<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		onAddIssue: () => void;
	}

	let { onAddIssue }: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 py-12 text-center">
	<p class="text-muted-foreground">{m.empty_issues_title()}</p>
	<button
		onclick={onAddIssue}
		class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
	>
		{m.empty_issues_add()}
	</button>
	<p class="text-xs text-muted-foreground/60">
		{m.empty_issues_help()}
	</p>
</div>

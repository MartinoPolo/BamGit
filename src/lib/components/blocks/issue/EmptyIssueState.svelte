<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/shadcn/button/index.js';

	interface Props {
		onAddIssue: () => void;
	}

	let { onAddIssue }: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 py-12 text-center">
	<p class="text-muted-foreground">{m.empty_issues_title()}</p>
	<Button variant="primary" onclick={onAddIssue}>
		{m.empty_issues_add()}
	</Button>
	<p class="text-xs text-muted-foreground/60">
		{m.empty_issues_help()}
	</p>
</div>

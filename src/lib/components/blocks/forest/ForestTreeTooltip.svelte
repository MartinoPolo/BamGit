<script lang="ts">
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';
	import type { Snippet } from 'svelte';

	interface Props {
		issueTitle: string;
		issueStatus: string;
		children: Snippet<[Record<string, unknown>]>;
	}

	let { issueTitle, issueStatus, children }: Props = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			{@render children(props)}
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Content side="top" sideOffset={8}>
		<span class="font-medium">{issueTitle}</span>
		<span class="text-muted-foreground/70"> · {issueStatus}</span>
	</Tooltip.Content>
</Tooltip.Root>

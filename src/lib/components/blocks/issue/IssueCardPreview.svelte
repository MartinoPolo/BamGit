<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useIssueCard } from '$lib/modules/issue-card/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import TreeThumbnailImage from '$lib/components/blocks/forest/TreeThumbnailImage.svelte';

	const ctx = useIssueCard();
</script>

<div
	class="relative flex size-25 shrink-0 items-end justify-center overflow-hidden rounded-1.75 border"
	style="background: linear-gradient(180deg, color-mix(in oklch, {ctx.color} var(--tree-bg-mix), var(--surface-2, hsl(0 0% 12%))) 0%, color-mix(in oklch, {ctx.color} 5%, var(--surface-3, hsl(0 0% 10%))) 100%); border-color: color-mix(in oklch, {ctx.color} 20%, var(--border));"
>
	{#if ctx.notificationDotColor !== null && ctx.sessionState === null}
		<SimpleTooltip text={m.issue_card_session_needs_attention()}>
			<span
				class="absolute top-1.5 right-1.5 z-10 size-1.75 animate-pulse rounded-full {ctx.notificationDotColor}"
			></span>
		</SimpleTooltip>
	{/if}
	{#if ctx.visualization}
		<div
			class="absolute inset-0"
			style="transform: scale(1.4); transform-origin: bottom center;"
		>
			<TreeThumbnailImage visualization={ctx.visualization} />
		</div>
	{:else}
		<div class="mb-4 size-6 rounded-full bg-foreground/20"></div>
	{/if}
</div>

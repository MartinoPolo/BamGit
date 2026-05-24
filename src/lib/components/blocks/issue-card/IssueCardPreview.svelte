<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useIssueCard } from './index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import TreeThumbnailImage from '$lib/components/blocks/forest/TreeThumbnailImage.svelte';

	const ctx = useIssueCard();
</script>

<div class={ctx.slotClasses.preview} style={ctx.previewStyleString}>
	{#if ctx.notificationDotColor !== null && ctx.sessionState === null}
		<SimpleTooltip text={m.issue_card_session_needs_attention()}>
			<span
				class="absolute top-1.5 right-1.5 z-10 size-1.75 animate-pulse rounded-full {ctx.notificationDotColor}"
			></span>
		</SimpleTooltip>
	{/if}
	{#if !ctx.isGhost && ctx.visualization}
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

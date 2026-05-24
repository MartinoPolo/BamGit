<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useIssueCard, isPreviewPosition, PREVIEW_POSITION_CLASSES } from './index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { PriorityBadge } from '$lib/components/derived/priority-badge/index.js';
	import type { DisplayPriority } from '$lib/components/derived/priority-badge/priority_badge_types.js';
	import TreeThumbnailImage from '$lib/components/blocks/forest/TreeThumbnailImage.svelte';

	const ctx = useIssueCard();

	const displayPriority = $derived(
		ctx.issue.priority !== null && ctx.issue.priority !== 'medium'
			? (ctx.issue.priority as DisplayPriority)
			: null,
	);

	const previewPosition = $derived.by(() => {
		const position = ctx.appearanceSettings.priorityPosition;
		return isPreviewPosition(position) ? position : null;
	});

	const showPreviewBadge = $derived(
		displayPriority !== null && ctx.prioritiesEnabled && previewPosition !== null,
	);
</script>

<div class={ctx.slotClasses.preview} style={ctx.previewStyleString}>
	{#if ctx.notificationDotColor !== null && ctx.sessionState === null}
		<SimpleTooltip text={m.issue_card_session_needs_attention()}>
			<span
				class="absolute top-1.5 right-1.5 z-10 size-1.75 animate-pulse rounded-full {ctx.notificationDotColor}"
			></span>
		</SimpleTooltip>
	{/if}
	{#if showPreviewBadge && displayPriority !== null && previewPosition !== null}
		<div class="z-10 {PREVIEW_POSITION_CLASSES[previewPosition]}">
			<PriorityBadge
				priority={displayPriority}
				position={ctx.appearanceSettings.priorityPosition}
				badgeStyle={ctx.appearanceSettings.badgeStyle}
				onclick={(event) => {
					event.stopPropagation();
					ctx.onPriorityClick?.();
				}}
			/>
		</div>
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

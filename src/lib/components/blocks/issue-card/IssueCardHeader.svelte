<script lang="ts">
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import { useIssueCard } from './index.js';
	import { setHoveredPrdNumber } from './prd_hover_store.svelte.js';
	import IssueCardHeaderActions from './IssueCardHeaderActions.svelte';

	const ctx = useIssueCard();

	const hasPrdLabel = $derived(ctx.prdParent !== null && ctx.prdParent.number !== null);

	function handleTitleClick(event: MouseEvent) {
		event.stopPropagation();
		if (ctx.onTitleClick) {
			ctx.onTitleClick(event);
		}
	}

	function handlePrdMouseEnter() {
		if (ctx.prdParent?.number !== null && ctx.prdParent?.number !== undefined) {
			setHoveredPrdNumber(ctx.prdParent.number);
		}
	}

	function handlePrdMouseLeave() {
		setHoveredPrdNumber(null);
	}
</script>

<div
	class={ctx.slotClasses.header}
	style="{ctx.headerStyleString}; color: var(--ic-header-text, {ctx.headerTextColor});"
>
	<div
		class="flex min-w-0 flex-1 items-center gap-1.5"
		style="filter: brightness(var(--header-brightness, 1)) saturate(var(--header-saturate, 1)); transition: filter var(--duration-3) ease;"
	>
		<span
			class="inline-flex shrink-0 items-center gap-0.5 font-mono text-[11px] font-semibold opacity-85"
		>
			{#if hasPrdLabel && ctx.prdParent?.url}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub link -->
				<a
					href={ctx.prdParent.url}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-0.5 hover:underline hover:opacity-100"
					style="color: inherit;"
					onclick={(event) => event.stopPropagation()}
					onmouseenter={handlePrdMouseEnter}
					onmouseleave={handlePrdMouseLeave}
					><ScrollTextIcon class="size-3" />{ctx.prdParent.number}</a
				>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<span class="opacity-50">/</span>
			{:else if hasPrdLabel && ctx.prdParent}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<span
					class="inline-flex items-center gap-0.5"
					onmouseenter={handlePrdMouseEnter}
					onmouseleave={handlePrdMouseLeave}
				>
					<ScrollTextIcon class="size-3" />{ctx.prdParent.number}
				</span>
				<span class="opacity-50">/</span>
			{/if}
			{#if ctx.issue.github_issue_url}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub link -->
				<a
					href={ctx.issue.github_issue_url}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:underline hover:opacity-100"
					style="color: var(--ic-number-color, inherit);"
					onclick={(event) => event.stopPropagation()}
					>#{ctx.issue.github_issue_number ?? '—'}</a
				>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{:else}
				<span style="color: var(--ic-number-color, inherit);"
					>#{ctx.issue.github_issue_number ?? '—'}</span
				>
			{/if}
		</span>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span
			class="min-w-0 truncate text-[13.5px] font-semibold leading-snug {ctx.onTitleClick
				? 'cursor-pointer hover:underline'
				: ''}"
			onclick={handleTitleClick}
		>
			{ctx.issue.name}
		</span>
	</div>

	<IssueCardHeaderActions />
</div>

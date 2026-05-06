<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache, IssueDependency } from '$lib/types/generated';
	import {
		computeVisualization,
		computeForestLayout,
		computeDepthRows,
		GROUND_Y_FRACTION,
		resolveGlowOverlay,
	} from '$lib/modules/visualization';
	import type {
		TreeVisualization,
		ForestLayoutItem,
		SessionForMapping,
	} from '$lib/modules/visualization';
	import { SvelteMap } from 'svelte/reactivity';
	import {
		LowPolyTree,
		PottedPlant,
		DEFAULT_TREE_CONFIG,
		OVERLAY_DEFAULTS,
		TRUNK_DEAD_SPACE_PERCENT,
	} from 'low-poly-2d-trees';
	import type { TreeConfig, OverlayConfig } from 'low-poly-2d-trees';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import SproutIcon from '@lucide/svelte/icons/sprout';
	import { Button } from '$lib/components/ui/button/index.js';
	import ForestTreeTooltip from './ForestTreeTooltip.svelte';
	import ForestContextMenu from './ForestContextMenu.svelte';
	import { TREE_CONTEXT_MENU_ACTIONS } from '$lib/modules/visualization';
	import type { TreeContextMenuAction } from '$lib/modules/visualization';
	import { useSelection } from '$lib/modules/board';
	import { BATCH_SELECTED_GLOW_COLOR } from './batch_selection_utils.js';

	interface Props {
		issues: readonly Issue[];
		dependencies: readonly IssueDependency[];
		getGitStatus: (issueId: string) => GitStatusCache | undefined;
		getSessionsForIssue: (issueId: string) => readonly SessionForMapping[];
		onAddIssue?: () => void;
		onArchiveIssue?: (issue: Issue) => void;
		onChangeIssueColor?: (issueId: string) => void;
	}

	let {
		issues,
		dependencies,
		getGitStatus,
		getSessionsForIssue,
		onAddIssue,
		onArchiveIssue,
		onChangeIssueColor,
	}: Props = $props();

	const TREE_NATURAL_WIDTH = 320;
	const TREE_NATURAL_HEIGHT = 320;
	const OAK_NATURAL_WIDTH = 448;
	const OAK_NATURAL_HEIGHT = 448;
	const POTTED_NATURAL_WIDTH = 192;
	const POTTED_NATURAL_HEIGHT = 288;

	let rawViewportWidth = $state(0);
	let rawViewportHeight = $state(0);

	let debouncedViewportWidth = $state(0);
	let debouncedViewportHeight = $state(0);
	let hasInitialDimensions = $state(false);

	$effect(() => {
		const w = rawViewportWidth;
		const h = rawViewportHeight;
		if (!hasInitialDimensions && w > 0 && h > 0) {
			hasInitialDimensions = true;
			debouncedViewportWidth = w;
			debouncedViewportHeight = h;
			return;
		}
		const timeout = setTimeout(() => {
			debouncedViewportWidth = w;
			debouncedViewportHeight = h;
		}, 100);
		return () => clearTimeout(timeout);
	});

	const interaction = useSelection();

	let contextMenu = $state<{ x: number; y: number; issueId: string } | null>(null);

	interface IssueEntry {
		readonly issue: Issue;
		readonly visualization: TreeVisualization;
		readonly layoutItem: ForestLayoutItem;
	}

	const entries = $derived.by<readonly IssueEntry[]>(() => {
		const visualizations = new SvelteMap<string, TreeVisualization>();

		for (const issue of issues) {
			const visualization = computeVisualization(
				issue,
				getGitStatus(issue.id),
				getSessionsForIssue(issue.id),
			);
			visualizations.set(issue.id, visualization);
		}

		const issueIds = issues.map((issue) => issue.id);
		const depthRows = computeDepthRows(issueIds, dependencies);

		const results: IssueEntry[] = [];
		for (const issue of issues) {
			const visualization = visualizations.get(issue.id)!;
			results.push({
				issue,
				visualization,
				layoutItem: buildLayoutItem(issue, visualization, depthRows.get(issue.id) ?? 0),
			});
		}
		return results;
	});

	const entryById = $derived.by(() => {
		const map = new SvelteMap<string, IssueEntry>();
		for (const entry of entries) {
			map.set(entry.issue.id, entry);
		}
		return map;
	});

	$effect(() => {
		const oakEntry = entries.find((entry) => entry.visualization.kind === 'oak');
		interaction.setPrdIssueId(oakEntry?.issue.id ?? null);
	});

	const layoutItems = $derived(entries.map((entry) => entry.layoutItem));
	const layoutResult = $derived(
		computeForestLayout(layoutItems, {
			width: debouncedViewportWidth,
			height: debouncedViewportHeight,
		}),
	);

	const groundStripHeight = $derived(debouncedViewportHeight * (1 - GROUND_Y_FRACTION));

	function buildLayoutItem(
		issue: Issue,
		visualization: TreeVisualization,
		depthRow: number,
	): ForestLayoutItem {
		if (visualization.kind === 'oak') {
			return {
				id: issue.id,
				kind: 'oak',
				priority: issue.priority,
				sortOrder: issue.sort_order,
			};
		}
		if (visualization.kind === 'tree') {
			return {
				id: issue.id,
				kind: 'tree',
				stage: visualization.config.stage,
				priority: issue.priority,
				sortOrder: issue.sort_order,
				depthRow,
			};
		}
		return {
			id: issue.id,
			kind: 'potted-plant',
			stage: visualization.stage,
			priority: issue.priority,
			sortOrder: issue.sort_order,
			depthRow,
		};
	}

	function getNaturalSize(entry: IssueEntry): { width: number; height: number } {
		if (entry.visualization.kind === 'oak') {
			return { width: OAK_NATURAL_WIDTH, height: OAK_NATURAL_HEIGHT };
		}
		if (entry.visualization.kind === 'potted-plant') {
			return { width: POTTED_NATURAL_WIDTH, height: POTTED_NATURAL_HEIGHT };
		}
		return { width: TREE_NATURAL_WIDTH, height: TREE_NATURAL_HEIGHT };
	}

	function getOakConfig(entry: IssueEntry): TreeConfig {
		if (entry.visualization.kind !== 'oak') {
			return DEFAULT_TREE_CONFIG;
		}
		return {
			...DEFAULT_TREE_CONFIG,
			shape: 'oak',
			stage: 'leafy',
			seed: entry.visualization.seed,
		};
	}

	function getResolvedOverlayConfig(entry: IssueEntry): OverlayConfig {
		const stateOverlay =
			entry.visualization.kind === 'tree'
				? entry.visualization.overlayConfig
				: OVERLAY_DEFAULTS;
		return resolveGlowOverlay({
			stateOverlay,
			issueId: entry.issue.id,
			hoveredIssueId: interaction.hoveredIssueId,
			activeIssueId: interaction.activeIssueId,
			batchSelectedIssueIds: interaction.batchSelectedIssueIds,
			hoverGlowColor: interaction.hoverGlowColor,
			activeGlowColor: interaction.activeGlowColor,
			batchSelectedGlowColor: BATCH_SELECTED_GLOW_COLOR,
		});
	}

	function handleTreeClick(entry: IssueEntry) {
		interaction.activateIssue(entry.issue.id);
	}

	function handleContextMenu(event: MouseEvent, entry: IssueEntry) {
		event.preventDefault();
		contextMenu = { x: event.clientX, y: event.clientY, issueId: entry.issue.id };
	}

	// fallow-ignore-next-line complexity
	function getGroundElementProps(
		entry: IssueEntry,
		rowIndex: number,
	): { groundElements: boolean; groundElementCount?: number } {
		if (rowIndex !== 0) {
			return { groundElements: false };
		}
		if (entry.visualization.kind === 'oak') {
			return { groundElements: true };
		}
		const stage =
			entry.visualization.kind === 'tree'
				? entry.visualization.config.stage
				: entry.visualization.stage;
		if (stage === 'seed' || stage === 'sprouting') {
			return { groundElements: false };
		}
		if (stage === 'sapling' || stage === 'growing') {
			return { groundElements: true, groundElementCount: 4 };
		}
		return { groundElements: true };
	}

	function handleGroundClick() {
		interaction.deactivate();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (contextMenu !== null) {
				contextMenu = null;
			} else {
				interaction.deactivate();
				if (document.activeElement instanceof HTMLElement) {
					document.activeElement.blur();
				}
			}
		}
	}

	// fallow-ignore-next-line complexity
	function handleContextMenuAction(action: TreeContextMenuAction) {
		const menu = contextMenu;
		if (menu === null) {
			return;
		}
		const entry = entryById.get(menu.issueId);
		if (entry === undefined) {
			return;
		}
		const issue = entry.issue;
		switch (action) {
			case TREE_CONTEXT_MENU_ACTIONS.archive:
				onArchiveIssue?.(issue);
				break;
			case TREE_CONTEXT_MENU_ACTIONS.changeColor:
				onChangeIssueColor?.(issue.id);
				break;
			case TREE_CONTEXT_MENU_ACTIONS.openGithub:
			case TREE_CONTEXT_MENU_ACTIONS.openWorktree:
			case TREE_CONTEXT_MENU_ACTIONS.startSession:
			case TREE_CONTEXT_MENU_ACTIONS.pruneWorktree:
				break;
		}
	}

	const emptyStateTreeConfig: TreeConfig = {
		...DEFAULT_TREE_CONFIG,
		stage: 'seed',
		shape: 'oak',
		seed: 1,
	};
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative w-full flex-1 overflow-hidden rounded-md outline-none"
	bind:clientWidth={rawViewportWidth}
	bind:clientHeight={rawViewportHeight}
	style:background="linear-gradient(to bottom, var(--sky-top), var(--sky-bot))"
	style:min-height="0"
	style:isolation="isolate"
	onkeydown={handleKeydown}
	tabindex="0"
>
	{#if issues.length === 0}
		<div class="absolute inset-0 flex flex-col items-center justify-center gap-4">
			<div class="w-24 h-24 opacity-60">
				<LowPolyTree config={emptyStateTreeConfig} />
			</div>
			<p class="text-sm text-foreground/70 font-medium">Your forest is empty</p>
			{#if onAddIssue}
				<Button variant="primary" onclick={onAddIssue}>
					<SproutIcon class="size-4" />
					Plant your first tree
				</Button>
			{/if}
		</div>
	{:else}
		<Tooltip.Provider>
			{#each layoutResult.items as positioned (positioned.id)}
				{@const entry = entryById.get(positioned.id)}
				{#if entry}
					{@const size = getNaturalSize(entry)}
					{@const overlayConfig = getResolvedOverlayConfig(entry)}
					{@const groundProps = getGroundElementProps(entry, positioned.rowIndex)}
					<ForestTreeTooltip
						issueTitle={entry.issue.name}
						issueStatus={entry.issue.status}
					>
						{#snippet children(triggerProps)}
							<button
								{...triggerProps}
								type="button"
								class="absolute border-0 bg-transparent p-0 transition-transform focus-visible:outline-2 focus-visible:outline-ring [&>svg]:pointer-events-auto [&>svg]:cursor-pointer"
								style:left="{positioned.x}px"
								style:top="{positioned.y}px"
								style:width="{size.width}px"
								style:height="{size.height}px"
								style:transform="translate(-50%, calc(-100% + {TRUNK_DEAD_SPACE_PERCENT *
									100}%)) scale({positioned.scale})"
								style:opacity={positioned.opacity}
								style:z-index={positioned.zIndex}
								style:pointer-events="none"
								onmouseenter={() => interaction.hoverIssue(entry.issue.id)}
								onmouseleave={() => interaction.unhover()}
								onclick={() => handleTreeClick(entry)}
								oncontextmenu={(e) => handleContextMenu(e, entry)}
								aria-label="Tree for issue {entry.issue.name}"
							>
								{#if entry.visualization.kind === 'oak'}
									<LowPolyTree
										config={getOakConfig(entry)}
										{overlayConfig}
										groundElements={groundProps.groundElements}
										groundElementCount={groundProps.groundElementCount}
									/>
								{:else if entry.visualization.kind === 'tree'}
									<LowPolyTree
										config={entry.visualization.config}
										toolVisibility={entry.visualization.toolVisibility}
										{overlayConfig}
										animateCanopySway={entry.visualization.animateCanopySway}
										animateGrowth={entry.visualization.animateGrowth}
										animateTools={entry.visualization.animateTools}
										groundElements={groundProps.groundElements}
										groundElementCount={groundProps.groundElementCount}
									/>
								{:else if entry.visualization.kind === 'potted-plant'}
									<PottedPlant
										stage={entry.visualization.stage}
										seed={entry.visualization.seed}
										{overlayConfig}
									/>
								{/if}
							</button>
						{/snippet}
					</ForestTreeTooltip>
				{/if}
			{/each}
		</Tooltip.Provider>
	{/if}
	<button
		type="button"
		class="absolute inset-x-0 bottom-0 cursor-default border-0 p-0"
		style:height="{groundStripHeight}px"
		style:background="linear-gradient(to top, var(--ground-dark), var(--ground-color))"
		style:z-index="1"
		onclick={handleGroundClick}
		tabindex="-1"
		aria-label="Forest ground — click to deselect"
	></button>

	{#if contextMenu}
		<ForestContextMenu
			x={contextMenu.x}
			y={contextMenu.y}
			onaction={handleContextMenuAction}
			ondismiss={() => (contextMenu = null)}
		/>
	{/if}
</div>

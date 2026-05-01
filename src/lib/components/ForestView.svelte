<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
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
	} from 'low-poly-2d-trees';
	import type { TreeConfig, OverlayConfig } from 'low-poly-2d-trees';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import SproutIcon from '@lucide/svelte/icons/sprout';
	import ForestTreeTooltip from './ForestTreeTooltip.svelte';
	import ForestContextMenu from './ForestContextMenu.svelte';
	import { setForestInteractionContext } from '$lib/modules/visualization';

	interface Props {
		issues: readonly Issue[];
		getGitStatus: (issueId: string) => GitStatusCache | undefined;
		getSessionsForIssue: (issueId: string) => readonly SessionForMapping[];
		onSelectIssue?: (issue: Issue) => void;
		onAddIssue?: () => void;
	}

	let { issues, getGitStatus, getSessionsForIssue, onSelectIssue, onAddIssue }: Props = $props();

	const TREE_NATURAL_WIDTH = 100;
	const TREE_NATURAL_HEIGHT = 100;
	const OAK_NATURAL_WIDTH = 140;
	const OAK_NATURAL_HEIGHT = 140;
	const POTTED_NATURAL_WIDTH = 60;
	const POTTED_NATURAL_HEIGHT = 90;

	let viewportWidth = $state(0);
	let viewportHeight = $state(0);

	const interaction = setForestInteractionContext();

	let contextMenu = $state<{ x: number; y: number; issueId: string } | null>(null);

	interface IssueEntry {
		readonly issue: Issue;
		readonly visualization: TreeVisualization;
		readonly layoutItem: ForestLayoutItem;
	}

	const entries = $derived.by<readonly IssueEntry[]>(() => {
		let prdIssueId: string | null = null;
		const visualizations = new SvelteMap<string, TreeVisualization>();
		const parentIssueIds = new SvelteMap<string, string | null>();

		for (const issue of issues) {
			const visualization = computeVisualization(
				issue,
				getGitStatus(issue.id),
				getSessionsForIssue(issue.id),
			);
			visualizations.set(issue.id, visualization);
			parentIssueIds.set(issue.id, issue.parent_issue_id);
			if (visualization.kind === 'oak') {
				prdIssueId = issue.id;
			}
		}

		const issueIds = issues.map((issue) => issue.id);
		const depthRows = computeDepthRows(issueIds, parentIssueIds, prdIssueId);

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

	const layoutResult = $derived(
		computeForestLayout(
			entries.map((entry) => entry.layoutItem),
			{ width: viewportWidth, height: viewportHeight },
		),
	);

	const groundStripHeight = $derived(viewportHeight * (1 - GROUND_Y_FRACTION));

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
			selectedIssueId: interaction.selectedIssueId,
			hoverGlowColor: interaction.hoverGlowColor,
			selectedGlowColor: interaction.selectedGlowColor,
		});
	}

	function handleTreeClick(entry: IssueEntry) {
		const wasSelected = interaction.selectedIssueId === entry.issue.id;
		interaction.selectIssue(entry.issue.id);
		if (!wasSelected) {
			onSelectIssue?.(entry.issue);
		}
	}

	function handleContextMenu(event: MouseEvent, entry: IssueEntry) {
		event.preventDefault();
		contextMenu = { x: event.clientX, y: event.clientY, issueId: entry.issue.id };
	}

	function handleGroundClick() {
		interaction.deselect();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (contextMenu !== null) {
				contextMenu = null;
			} else {
				interaction.deselect();
			}
		}
	}

	function handleContextMenuAction() {}

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
	bind:clientWidth={viewportWidth}
	bind:clientHeight={viewportHeight}
	style:background="linear-gradient(to bottom, var(--sky-top), var(--sky-bot))"
	style:min-height="300px"
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
				<button
					type="button"
					class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					onclick={onAddIssue}
				>
					<SproutIcon class="size-4" />
					Plant your first tree
				</button>
			{/if}
		</div>
	{:else}
		<Tooltip.Provider>
			{#each layoutResult.items as positioned (positioned.id)}
				{@const entry = entryById.get(positioned.id)}
				{#if entry}
					{@const size = getNaturalSize(entry)}
					{@const overlayConfig = getResolvedOverlayConfig(entry)}
					<ForestTreeTooltip
						issueTitle={entry.issue.name}
						issueStatus={entry.issue.status}
					>
						{#snippet children(triggerProps)}
							<button
								{...triggerProps}
								type="button"
								class="absolute cursor-pointer border-0 bg-transparent p-0 transition-transform hover:brightness-110 focus-visible:outline-2 focus-visible:outline-ring"
								style:left="{positioned.x}px"
								style:top="{positioned.y}px"
								style:width="{size.width}px"
								style:height="{size.height}px"
								style:transform="translate(-50%, -100%) scale({positioned.scale})"
								style:opacity={positioned.opacity}
								style:z-index={positioned.zIndex}
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
										groundElements={positioned.rowIndex === 0}
									/>
								{:else if entry.visualization.kind === 'tree'}
									<LowPolyTree
										config={entry.visualization.config}
										toolVisibility={entry.visualization.toolVisibility}
										{overlayConfig}
										animateCanopySway={entry.visualization.animateCanopySway}
										animateGrowth={entry.visualization.animateGrowth}
										animateTools={entry.visualization.animateTools}
										groundElements={positioned.rowIndex === 0}
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
		class="absolute bottom-0 left-0 right-0 cursor-default border-0 p-0"
		style:height="{groundStripHeight}px"
		style:background="var(--ground-color)"
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

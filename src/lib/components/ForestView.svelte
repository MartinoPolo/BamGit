<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import {
		computeVisualization,
		computeForestLayout,
		computeDepthRows,
		GROUND_Y_FRACTION,
	} from '$lib/modules/visualization';
	import type {
		TreeVisualization,
		ForestLayoutItem,
		PositionedForestItem,
		SessionForMapping,
	} from '$lib/modules/visualization';
	import { SvelteMap } from 'svelte/reactivity';
	import { LowPolyTree, PottedPlant, DEFAULT_TREE_CONFIG } from 'low-poly-2d-trees';
	import type { TreeConfig } from 'low-poly-2d-trees';
	import SproutIcon from '@lucide/svelte/icons/sprout';

	interface Props {
		issues: readonly Issue[];
		getGitStatus: (issueId: string) => GitStatusCache | undefined;
		getSessionsForIssue: (issueId: string) => readonly SessionForMapping[];
		onSelectIssue: (issue: Issue) => void;
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

	function handleSelect(positioned: PositionedForestItem) {
		const entry = entryById.get(positioned.id);
		if (entry !== undefined) {
			onSelectIssue(entry.issue);
		}
	}

	const emptyStateTreeConfig: TreeConfig = {
		...DEFAULT_TREE_CONFIG,
		stage: 'seed',
		shape: 'oak',
		seed: 1,
	};
</script>

<div
	class="relative w-full flex-1 overflow-hidden rounded-md"
	bind:clientWidth={viewportWidth}
	bind:clientHeight={viewportHeight}
	style:background="linear-gradient(to bottom, var(--sky-top), var(--sky-bot))"
	style:min-height="300px"
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
		{#each layoutResult.items as positioned (positioned.id)}
			{@const entry = entryById.get(positioned.id)}
			{#if entry}
				{@const size = getNaturalSize(entry)}
				<button
					type="button"
					class="absolute cursor-pointer border-0 bg-transparent p-0 transition-transform hover:brightness-110 focus-visible:outline-2 focus-visible:outline-ring"
					style:left="{positioned.x}px"
					style:top="{positioned.y}px"
					style:width="{size.width}px"
					style:height="{size.height}px"
					style:transform="translate(-50%, -100%) scale({positioned.scale})"
					style:opacity={positioned.opacity}
					style:z-index={positioned.zIndex}
					onclick={() => handleSelect(positioned)}
					title={entry.issue.name}
					aria-label="Open issue {entry.issue.name}"
				>
					{#if entry.visualization.kind === 'oak'}
						<LowPolyTree
							config={getOakConfig(entry)}
							groundElements={positioned.rowIndex === 0}
						/>
					{:else if entry.visualization.kind === 'tree'}
						<LowPolyTree
							config={entry.visualization.config}
							toolVisibility={entry.visualization.toolVisibility}
							overlayConfig={entry.visualization.overlayConfig}
							animateCanopySway={entry.visualization.animateCanopySway}
							animateGrowth={entry.visualization.animateGrowth}
							animateTools={entry.visualization.animateTools}
							groundElements={positioned.rowIndex === 0}
						/>
					{:else if entry.visualization.kind === 'potted-plant'}
						<PottedPlant
							stage={entry.visualization.stage}
							seed={entry.visualization.seed}
						/>
					{/if}
				</button>
			{/if}
		{/each}
	{/if}
	<div
		class="absolute bottom-0 left-0 right-0"
		style:height="{groundStripHeight}px"
		style:background="var(--ground-color)"
		style:z-index="1"
	></div>
</div>

<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import { computeVisualization, computeForestLayout } from '$lib/modules/visualization';
	import type {
		TreeVisualization,
		ForestLayoutItem,
		PositionedForestItem,
		SessionForMapping,
	} from '$lib/modules/visualization';
	import { SvelteMap } from 'svelte/reactivity';
	import { LowPolyTree, PottedPlant } from 'low-poly-2d-trees';

	interface Props {
		issues: readonly Issue[];
		getGitStatus: (issueId: string) => GitStatusCache | undefined;
		getSessionsForIssue: (issueId: string) => readonly SessionForMapping[];
		onSelectIssue: (issue: Issue) => void;
	}

	let { issues, getGitStatus, getSessionsForIssue, onSelectIssue }: Props = $props();

	const TREE_NATURAL_WIDTH = 100;
	const TREE_NATURAL_HEIGHT = 100;
	const POTTED_NATURAL_WIDTH = 60;
	const POTTED_NATURAL_HEIGHT = 90;

	let viewportWidth = $state(0);
	let viewportHeight = $state(0);

	type RenderableVisualization = Exclude<TreeVisualization, { kind: 'oak' }>;

	interface IssueEntry {
		readonly issue: Issue;
		readonly visualization: RenderableVisualization;
		readonly layoutItem: ForestLayoutItem;
	}

	const entries = $derived.by<readonly IssueEntry[]>(() => {
		const results: IssueEntry[] = [];
		for (const issue of issues) {
			const visualization = computeVisualization(
				issue,
				getGitStatus(issue.id),
				getSessionsForIssue(issue.id),
			);
			if (visualization.kind === 'oak') {
				continue;
			}
			const renderable: RenderableVisualization = visualization;
			results.push({
				issue,
				visualization: renderable,
				layoutItem: buildLayoutItem(issue, renderable),
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

	function buildLayoutItem(
		issue: Issue,
		visualization: RenderableVisualization,
	): ForestLayoutItem {
		if (visualization.kind === 'tree') {
			return {
				id: issue.id,
				kind: 'tree',
				stage: visualization.config.stage,
				priority: issue.priority,
				sortOrder: issue.sort_order,
			};
		}
		return {
			id: issue.id,
			kind: 'potted-plant',
			stage: visualization.stage,
			priority: issue.priority,
			sortOrder: issue.sort_order,
		};
	}

	function getNaturalSize(entry: IssueEntry): { width: number; height: number } {
		if (entry.visualization.kind === 'potted-plant') {
			return { width: POTTED_NATURAL_WIDTH, height: POTTED_NATURAL_HEIGHT };
		}
		return { width: TREE_NATURAL_WIDTH, height: TREE_NATURAL_HEIGHT };
	}

	function handleSelect(positioned: PositionedForestItem) {
		const entry = entryById.get(positioned.id);
		if (entry !== undefined) {
			onSelectIssue(entry.issue);
		}
	}
</script>

<div
	class="relative h-150 w-full overflow-hidden rounded-md border border-border bg-muted/10"
	bind:clientWidth={viewportWidth}
	bind:clientHeight={viewportHeight}
>
	{#if issues.length === 0}
		<p class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
			No issues to visualise.
		</p>
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
					style:transform="translate(-50%, -50%) scale({positioned.scale})"
					style:opacity={positioned.opacity}
					style:z-index={positioned.zIndex}
					onclick={() => handleSelect(positioned)}
					title={entry.issue.name}
					aria-label="Open issue {entry.issue.name}"
				>
					{#if entry.visualization.kind === 'tree'}
						<LowPolyTree
							config={entry.visualization.config}
							toolVisibility={entry.visualization.toolVisibility}
							overlayConfig={entry.visualization.overlayConfig}
							animateCanopySway={entry.visualization.animateCanopySway}
							animateGrowth={entry.visualization.animateGrowth}
							animateTools={entry.visualization.animateTools}
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
</div>

<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache, IssueDependency } from '$lib/types/generated';
	import {
		computeVisualization,
		computeForestLayout,
		computeDepthRows,
		resolveGlowOverlay,
		GROUND_Y_FRACTION,
	} from '$lib/modules/visualization';
	import type {
		TreeVisualization,
		TreeComputeContext,
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
	import { useSettings } from '$lib/modules/settings';
	import { BACKGROUND_THEMES } from '$lib/modules/board/types.js';
	import * as m from '$lib/paraglide/messages.js';
	import SproutIcon from '@lucide/svelte/icons/sprout';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import PlayIcon from '@lucide/svelte/icons/play';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import ScissorsIcon from '@lucide/svelte/icons/scissors';
	import MountainIcon from '@lucide/svelte/icons/mountain';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as ContextMenu from '$lib/components/shadcn/context-menu/index.js';
	import ForestTreeTooltip from './ForestTreeTooltip.svelte';
	import { TREE_CONTEXT_MENU_ACTIONS } from '$lib/modules/visualization';
	import type { TreeContextMenuAction } from '$lib/modules/visualization';
	import { isContextMenuActionEnabled } from './forest_context_menu_utils.js';
	import { useSelection } from '$lib/modules/board';
	import { BATCH_SELECTED_GLOW_COLOR } from '$lib/components/blocks/issue-card/batch_selection_utils.js';
	import { SPECIAL_LABELS } from '$lib/modules/visualization';

	interface Props {
		issues: readonly Issue[];
		allIssues: readonly Issue[];
		dependencies: readonly IssueDependency[];
		getGitStatus: (issueId: string) => GitStatusCache | undefined;
		getSessionsForIssue: (issueId: string) => readonly SessionForMapping[];
		onAddIssue?: () => void;
		onArchiveIssue?: (issue: Issue) => void;
		onChangeIssueColor?: (issueId: string) => void;
	}

	let {
		issues,
		allIssues,
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

	const STAR_COUNT = 25;
	const STARS = Array.from({ length: STAR_COUNT }, (_, i) => ({
		x: ((i * 53 + 13) % 96) + 2,
		y: ((i * 71 + 7) % 55) + 3,
		size: 1 + (i % 3),
		delay: (i * 1.3) % 4,
		opacity: 0.3 + (i % 5) * 0.1,
	}));

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
	const settingsCtx = useSettings();
	const isDark = $derived(settingsCtx.isDark);
	const backgroundTheme = $derived(settingsCtx.getBackgroundTheme());
	const showMountains = $derived(settingsCtx.getShowMountains());
	const showStars = $derived(settingsCtx.getShowStars());
	const showMoon = $derived(settingsCtx.getShowMoon());

	const GROUND_MARGIN_ABOVE_HIGHEST_TREE_PX = 40;
	const MOUNTAINS_GROUND_OVERLAP_PX = 100;
	const MOUNTAINS_FADE_MIN_PX = 60;
	const MOUNTAINS_FADE_MAX_PX = 100;

	const groundY = $derived(debouncedViewportHeight * GROUND_Y_FRACTION);

	const groundTopY = $derived.by(() => {
		if (layoutResult.items.length === 0) {
			return groundY;
		}
		const highestTreeY = Math.min(...layoutResult.items.map((item) => item.y));
		return Math.max(0, highestTreeY - GROUND_MARGIN_ABOVE_HIGHEST_TREE_PX);
	});

	const mountainsHeight = $derived(groundTopY + MOUNTAINS_GROUND_OVERLAP_PX);
	const mountainsOpacity = $derived.by(() => {
		if (groundTopY < MOUNTAINS_FADE_MIN_PX) {
			return 0;
		}
		if (groundTopY < MOUNTAINS_FADE_MAX_PX) {
			return (
				(groundTopY - MOUNTAINS_FADE_MIN_PX) /
				(MOUNTAINS_FADE_MAX_PX - MOUNTAINS_FADE_MIN_PX)
			);
		}
		return 1;
	});

	let contextMenuIssueId = $state<string | null>(null);

	interface ContextMenuItem {
		readonly action: TreeContextMenuAction;
		readonly label: () => string;
		readonly icon: typeof GlobeIcon;
	}

	const contextMenuItems: readonly ContextMenuItem[] = [
		{
			action: TREE_CONTEXT_MENU_ACTIONS.openGithub,
			label: () => m.forest_menu_open_github(),
			icon: GlobeIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.openWorktree,
			label: () => m.forest_menu_open_worktree(),
			icon: GitBranchIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.startSession,
			label: () => m.forest_menu_start_session(),
			icon: PlayIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.archive,
			label: () => m.forest_menu_archive(),
			icon: ArchiveIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.changeColor,
			label: () => m.forest_menu_change_color(),
			icon: PaletteIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.pruneWorktree,
			label: () => m.forest_menu_prune_worktree(),
			icon: ScissorsIcon,
		},
	];

	interface IssueEntry {
		readonly issue: Issue;
		readonly visualization: TreeVisualization;
		readonly layoutItem: ForestLayoutItem;
	}

	interface VisualizationCacheEntry {
		readonly fingerprint: string;
		readonly result: TreeVisualization;
	}

	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- intentionally non-reactive perf cache
	const visualizationCache = new Map<string, VisualizationCacheEntry>();

	// fallow-ignore-next-line complexity
	function computeVisualizationFingerprint(
		issue: Issue,
		gitStatus: GitStatusCache | undefined,
		sessions: readonly SessionForMapping[],
		context: TreeComputeContext | undefined,
	): string {
		const sessionPart = sessions.map((s) => s.state).join(',');
		const runningPhase = sessions.find((s) => s.state === 'running')?.execution_phase ?? '';
		const labelPart = issue.labels.map((l) => l.name).join(',');
		const ctxPart = context
			? `${context.subIssueCompletionRatio}|${context.subIssueCount}|${context.hasCompletedSession}|${context.hasCommitsOnBranch}|${context.sessionCount}`
			: '';
		return `${issue.status}|${issue.worktree_state}|${issue.branch_name}|${issue.color}|${labelPart}|${gitStatus?.branch_status}|${gitStatus?.pr_state}|${gitStatus?.github_issue_state}|${gitStatus?.merge_conflict}|${gitStatus?.behind_base_count}|${sessionPart}|${runningPhase}|${ctxPart}`;
	}

	const childrenByParentId = $derived.by(() => {
		const map = new SvelteMap<string, Issue[]>();
		for (const issue of allIssues) {
			if (issue.parent_issue_id !== null) {
				const existing = map.get(issue.parent_issue_id);
				if (existing !== undefined) {
					existing.push(issue);
				} else {
					map.set(issue.parent_issue_id, [issue]);
				}
			}
		}
		return map;
	});

	function buildComputeContext(issue: Issue): TreeComputeContext | undefined {
		const isPrd = issue.labels.some((label) => label.name.toLowerCase() === SPECIAL_LABELS.prd);
		if (!isPrd) {
			return undefined;
		}
		const children = childrenByParentId.get(issue.id) ?? [];
		const totalCount = children.length;
		const completedCount = children.filter((child) => child.status === 'archived').length;
		const sessions = getSessionsForIssue(issue.id);

		return {
			isPrd: true,
			prdTitle: issue.name,
			subIssueCompletionRatio: totalCount > 0 ? completedCount / totalCount : 0,
			subIssueCount: totalCount,
			hasCompletedSession: sessions.some((s) => s.state === 'finished'),
			hasCommitsOnBranch: getGitStatus(issue.id)?.branch_status === 'active',
			sessionCount: sessions.length,
			issueId: issue.id,
		};
	}

	// fallow-ignore-next-line complexity
	const entries = $derived.by<readonly IssueEntry[]>(() => {
		const visualizations = new SvelteMap<string, TreeVisualization>();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to derived, not persisted
		const activeIds = new Set<string>();

		for (const issue of issues) {
			activeIds.add(issue.id);
			const context = buildComputeContext(issue);
			const gitStatus = getGitStatus(issue.id);
			const sessions = getSessionsForIssue(issue.id);
			const fingerprint = computeVisualizationFingerprint(
				issue,
				gitStatus,
				sessions,
				context,
			);
			const cached = visualizationCache.get(issue.id);
			let visualization: TreeVisualization;
			if (cached && cached.fingerprint === fingerprint) {
				visualization = cached.result;
			} else {
				visualization = computeVisualization(issue, gitStatus, sessions, context);
				visualizationCache.set(issue.id, { fingerprint, result: visualization });
			}
			visualizations.set(issue.id, visualization);
		}

		for (const key of visualizationCache.keys()) {
			if (!activeIds.has(key)) {
				visualizationCache.delete(key);
			}
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
			issueColor: entry.issue.color ?? '#525252',
			batchSelectedGlowColor: BATCH_SELECTED_GLOW_COLOR,
		});
	}

	function handleTreeClick(entry: IssueEntry, event: MouseEvent) {
		if (event.ctrlKey || event.metaKey) {
			event.preventDefault();
			interaction.toggleBatchSelect(entry.issue.id);
			return;
		}
		interaction.activateIssue(entry.issue.id);
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

	function handleBackgroundClick() {
		interaction.deactivate();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			interaction.deactivate();
			if (document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
		}
	}

	// fallow-ignore-next-line complexity
	function handleContextMenuAction(action: TreeContextMenuAction) {
		if (contextMenuIssueId === null) {
			return;
		}
		const entry = entryById.get(contextMenuIssueId);
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

	function handleBackgroundThemeChange(value: string) {
		void settingsCtx.set('backgroundTheme', value);
	}

	function formatThemeName(theme: string): string {
		return theme.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
<ContextMenu.Root>
	<ContextMenu.Trigger class="flex flex-1 overflow-hidden">
		<div
			class="relative w-full flex-1 outline-none"
			bind:clientWidth={rawViewportWidth}
			bind:clientHeight={rawViewportHeight}
			style:background="linear-gradient(to bottom, var(--sky-top), var(--sky-bot))"
			style:min-height="0"
			style:isolation="isolate"
			style:contain="content"
			onkeydown={handleKeydown}
			tabindex="0"
		>
			<!-- Full-bleed clickable background for deselect + forest context menu -->
			<button
				type="button"
				class="absolute inset-0 cursor-default border-0 bg-transparent p-0"
				style:z-index="0"
				onclick={handleBackgroundClick}
				tabindex="-1"
				aria-label="Forest background — click to deselect"
			></button>

			{#if issues.length === 0}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute inset-0 flex flex-col items-center justify-center gap-4"
					style:z-index="5"
					oncontextmenu={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<div class="w-24 h-24 opacity-60">
						<LowPolyTree config={emptyStateTreeConfig} />
					</div>
					<p class="text-sm text-foreground/70 font-medium">Your forest is empty</p>
					{#if onAddIssue}
						<Button intent="primary" onclick={onAddIssue}>
							<SproutIcon data-icon="inline-start" />
							Create your first issue
						</Button>
					{/if}
				</div>
			{:else}
				{#each layoutResult.items as positioned (positioned.id)}
					{@const entry = entryById.get(positioned.id)}
					{#if entry}
						{@const size = getNaturalSize(entry)}
						{@const overlayConfig = getResolvedOverlayConfig(entry)}
						{@const groundProps = getGroundElementProps(entry, positioned.rowIndex)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div style="display: contents" oncontextmenu={(e) => e.stopPropagation()}>
							<ContextMenu.Root
								onOpenChange={(open) => {
									if (open) {
										contextMenuIssueId = entry.issue.id;
									}
								}}
							>
								<ContextMenu.Trigger class="contents">
									<ForestTreeTooltip
										issueTitle={entry.issue.name}
										issueStatus={entry.issue.status}
									>
										{#snippet children(triggerProps)}
											<button
												{...triggerProps}
												type="button"
												class="absolute border-0 bg-transparent p-0 transition-transform duration-4 focus-visible:outline-2 focus-visible:outline-ring [&>svg]:pointer-events-none [&_.tree-root]:pointer-events-auto [&_.tree-root]:cursor-pointer"
												style:left="{positioned.x}px"
												style:top="{positioned.y}px"
												style:width="{size.width}px"
												style:height="{size.height}px"
												style:transform="translate(-50%, calc(-100% + {TRUNK_DEAD_SPACE_PERCENT *
													100}%)) scale({positioned.scale})"
												style:opacity={positioned.opacity}
												style:z-index={positioned.zIndex}
												style:pointer-events="none"
												style:will-change="transform"
												onmouseenter={() =>
													interaction.hoverIssue(entry.issue.id)}
												onmouseleave={() => interaction.unhover()}
												onclick={(event) => handleTreeClick(entry, event)}
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
														toolVisibility={entry.visualization
															.toolVisibility}
														{overlayConfig}
														animateCanopySway={entry.visualization
															.animateCanopySway}
														animateGrowth={entry.visualization
															.animateGrowth}
														animateTools={entry.visualization
															.animateTools}
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
								</ContextMenu.Trigger>
								<ContextMenu.Content>
									{#each contextMenuItems as item (item.action)}
										<ContextMenu.Item
											disabled={!isContextMenuActionEnabled(item.action)}
											onclick={() => handleContextMenuAction(item.action)}
										>
											<item.icon class="size-4" />
											{item.label()}
										</ContextMenu.Item>
									{/each}
								</ContextMenu.Content>
							</ContextMenu.Root>
						</div>
					{/if}
				{/each}
			{/if}

			<!-- Ground — extends from highest tree down to bottom, layers above mountains -->
			<div
				class="pointer-events-none absolute inset-x-0 bottom-0"
				style:top="{groundTopY}px"
				style:z-index="2"
				style:background="linear-gradient(to bottom, var(--ground-color),
				var(--ground-dark))"
			></div>

			<!-- Mountains — proportionally scaled, cropped from top as container shrinks -->
			{#if showMountains}
				<svg
					class="pointer-events-none absolute inset-x-0 top-0 w-full"
					style:height="{mountainsHeight}px"
					style:z-index="1"
					style:opacity={mountainsOpacity}
					style:transition="opacity var(--duration-4) ease"
					viewBox="0 0 1400 600"
					preserveAspectRatio="xMidYMax slice"
					overflow="hidden"
				>
					<defs>
						<linearGradient id="near-mountain-fill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="var(--mountain-near)" />
							<stop offset="100%" stop-color="var(--ground-dark)" />
						</linearGradient>
					</defs>
					<!-- Far mountains -->
					<polygon
						points="0,600 0,340 80,280 200,320 350,220 500,280 650,200 800,260 950,240 1100,300 1250,260 1400,320 1400,600"
						style="fill: var(--mountain-far); opacity: 0.7"
					/>
					<!-- Mid mountains -->
					<polygon
						points="0,600 0,380 120,320 240,360 380,280 500,340 650,300 780,350 920,290 1060,340 1200,310 1400,370 1400,600"
						style="fill: var(--mountain-mid); opacity: 0.85"
					/>
					<!-- Near mountains — blends into the ground div below -->
					<polygon
						points="0,600 0,420 100,380 220,410 340,360 480,400 600,370 740,410 860,380 1000,410 1140,370 1280,400 1400,420 1400,600"
						fill="url(#near-mountain-fill)"
					/>
				</svg>
			{/if}

			{#if isDark}
				<!-- Moon (dark mode only) -->
				{#if showMoon}
					<div
						class="pointer-events-none absolute rounded-full"
						style="
							top: 8%;
							right: 12%;
							width: 40px;
							height: 40px;
							z-index: 1;
							background: radial-gradient(circle, oklch(0.82 0.02 90) 0%, oklch(0.78 0.025 90) 60%, oklch(0.75 0.03 90) 100%);
							box-shadow: 0 0 25px 10px var(--moon-glow), 0 0 50px 20px color-mix(in oklch, var(--moon-glow) 25%, transparent);
						"
					></div>
				{/if}

				<!-- Stars (dark mode only) -->
				{#if showStars}
					<div
						class="pointer-events-none absolute inset-0 forest-stars"
						style:z-index="1"
					>
						{#each STARS as star (star.x * 1000 + star.y)}
							<div
								class="absolute rounded-full forest-star"
								style:left="{star.x}%"
								style:top="{star.y}%"
								style:width="{star.size}px"
								style:height="{star.size}px"
								style:opacity={star.opacity}
								style:background="var(--star-color, oklch(0.75 0.02 90))"
								style:animation-delay="{star.delay}s"
							></div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</ContextMenu.Trigger>

	<!-- Forest-level context menu -->
	<ContextMenu.Content>
		<ContextMenu.Sub>
			<ContextMenu.SubTrigger>
				<MountainIcon class="size-4" />
				{m.forest_menu_background_theme()}
			</ContextMenu.SubTrigger>
			<ContextMenu.Portal>
				<ContextMenu.SubContent>
					<ContextMenu.RadioGroup
						value={backgroundTheme}
						onValueChange={handleBackgroundThemeChange}
					>
						{#each BACKGROUND_THEMES as theme (theme)}
							<ContextMenu.RadioItem value={theme}>
								{formatThemeName(theme)}
							</ContextMenu.RadioItem>
						{/each}
					</ContextMenu.RadioGroup>
				</ContextMenu.SubContent>
			</ContextMenu.Portal>
		</ContextMenu.Sub>
		{#if isDark}
			<ContextMenu.Separator />
			<ContextMenu.CheckboxItem
				checked={showMountains}
				onCheckedChange={(checked) =>
					void settingsCtx.set('showMountains', String(checked))}
			>
				{m.forest_menu_show_mountains()}
			</ContextMenu.CheckboxItem>
			<ContextMenu.CheckboxItem
				checked={showStars}
				onCheckedChange={(checked) => void settingsCtx.set('showStars', String(checked))}
			>
				{m.forest_menu_show_stars()}
			</ContextMenu.CheckboxItem>
			<ContextMenu.CheckboxItem
				checked={showMoon}
				onCheckedChange={(checked) => void settingsCtx.set('showMoon', String(checked))}
			>
				{m.forest_menu_show_moon()}
			</ContextMenu.CheckboxItem>
		{/if}
	</ContextMenu.Content>
</ContextMenu.Root>

<style>
	.forest-star {
		animation: -global-star-twinkle 3.5s ease-in-out infinite;
	}

	@keyframes -global-star-twinkle {
		0%,
		100% {
			opacity: var(--tw-opacity, 0.5);
		}
		50% {
			opacity: calc(var(--tw-opacity, 0.5) * 0.7);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.forest-star {
			animation: none;
		}
	}
</style>

<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within, fn } from 'storybook/test';
	import DependencyGraphView from './DependencyGraphView.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/DependencyGraph/DependencyGraphView',
		component: DependencyGraphView,
		tags: ['autodocs'],
	});

	// ── Play: graph renders with visible nodes ──────────────────────────
	const playNodesVisible = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Nodes are role="button" with aria-label "Issue: …" or "PRD: …"
		await waitFor(() => {
			const nodeButtons = canvas.getAllByRole('button', { name: /^(Issue|PRD): / });
			expect(nodeButtons.length).toBeGreaterThan(0);
		});

		// Verify known issue names are rendered inside nodes
		await waitFor(() => {
			expect(canvas.getByText('Refactor auth middleware for OAuth2')).toBeInTheDocument();
		});

		// Verify another issue from the dependency chain is rendered
		// (PRDs don't appear in Global view because they're not direct dependency participants)
		await waitFor(() => {
			expect(
				canvas.getByText('Fix sound engine (Tokio crash, errors, MP3, rotation)'),
			).toBeInTheDocument();
		});
	};

	// ── Play: view mode switcher ────────────────────────────────────────
	const playViewModeSwitcher = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Wait for initial render in "Global" mode
		const tabs = canvas.getAllByRole('tab');
		const globalTab = tabs.find((tab) => tab.textContent?.includes('Global'))!;
		const prdsTab = tabs.find((tab) => tab.textContent?.includes('PRDs'))!;
		const singlePrdTab = tabs.find((tab) => tab.textContent?.includes('Single PRD'))!;

		// Initial state: Global is active
		await expect(globalTab).toHaveAttribute('aria-selected', 'true');
		await expect(prdsTab).toHaveAttribute('aria-selected', 'false');

		// Click "PRDs" tab → switches view
		await userEvent.click(prdsTab);
		await expect(prdsTab).toHaveAttribute('aria-selected', 'true');
		await expect(globalTab).toHaveAttribute('aria-selected', 'false');

		// PRDs view should still show PRD nodes
		await waitFor(() => {
			const prdNodes = canvas.getAllByRole('button', { name: /^PRD: / });
			expect(prdNodes.length).toBeGreaterThan(0);
		});

		// Click "Single PRD" tab → switches view, shows PRD select dropdown
		await userEvent.click(singlePrdTab);
		await expect(singlePrdTab).toHaveAttribute('aria-selected', 'true');
		await expect(prdsTab).toHaveAttribute('aria-selected', 'false');

		// A PRD select dropdown should now be visible
		await waitFor(() => {
			expect(canvas.getByLabelText('Select PRD')).toBeInTheDocument();
		});

		// Switch back to Global
		await userEvent.click(globalTab);
		await expect(globalTab).toHaveAttribute('aria-selected', 'true');
	};

	// ── Play: filter bar toggles ────────────────────────────────────────
	const playFilterBarToggles = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Wait for initial render
		await waitFor(() => {
			const nodeButtons = canvas.getAllByRole('button', { name: /^(Issue|PRD): / });
			expect(nodeButtons.length).toBeGreaterThan(0);
		});

		const nodeCountBefore = canvas.getAllByRole('button', { name: /^(Issue|PRD): / }).length;

		// Verify "Closed" toggle exists and starts false
		const closedToggle = canvas.getByRole('button', { name: /closed/i });
		await expect(closedToggle).toHaveAttribute('aria-pressed', 'false');

		// Toggle "AFK" filter — should filter to only AFK-labeled issues (fewer nodes)
		const afkToggle = canvas.getByRole('button', { name: /^AFK$/i });
		await expect(afkToggle).toHaveAttribute('aria-pressed', 'false');
		await userEvent.click(afkToggle);
		await expect(afkToggle).toHaveAttribute('aria-pressed', 'true');

		await waitFor(() => {
			const afkNodeCount = canvas.getAllByRole('button', { name: /^(Issue|PRD): / }).length;
			expect(afkNodeCount).toBeLessThan(nodeCountBefore);
		});

		// Untoggle AFK to restore original count
		await userEvent.click(afkToggle);
		await expect(afkToggle).toHaveAttribute('aria-pressed', 'false');

		await waitFor(() => {
			const restoredCount = canvas.getAllByRole('button', { name: /^(Issue|PRD): / }).length;
			expect(restoredCount).toBe(nodeCountBefore);
		});
	};

	// ── Play: click node → selected state ───────────────────────────────
	const playNodeSelect = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Wait for nodes to render
		await waitFor(() => {
			const nodes = canvas.getAllByRole('button', { name: /^(Issue|PRD): / });
			expect(nodes.length).toBeGreaterThan(0);
		});

		// Find a specific node and click it
		const targetNode = canvas.getByRole('button', {
			name: 'Issue: Refactor auth middleware for OAuth2',
		});

		await userEvent.click(targetNode);

		// After clicking, the node's parent .dep-node should have .selected class
		await waitFor(() => {
			const depNode = targetNode.closest('[data-dep-node="true"]') ?? targetNode;
			expect(depNode.classList.contains('selected')).toBe(true);
		});
	};

	// ── Play: empty state message ───────────────────────────────────────
	const playEmptyState = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// With no issues, empty state message should be visible
		await waitFor(() => {
			expect(canvas.getByText('No blocking relationships defined')).toBeInTheDocument();
		});

		// The SVG canvas should not be present (no nodes to render)
		const nodeButtons = canvas.queryAllByRole('button', { name: /^(Issue|PRD): / });
		await expect(nodeButtons.length).toBe(0);
	};
</script>

<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import { MOCK_ISSUES, MOCK_ISSUE_DEPENDENCIES } from '$lib/tauri_mock_data.js';
	import DependencyGraphStoryWrapper from './DependencyGraphStoryWrapper.svelte';

	function parseMockIssue(raw: (typeof MOCK_ISSUES)[number]): Issue {
		return {
			...raw,
			labels: typeof raw.labels === 'string' ? JSON.parse(raw.labels) : (raw.labels ?? []),
		} as Issue;
	}

	const allIssues = MOCK_ISSUES.map(parseMockIssue);
	const singleIssue = allIssues.slice(0, 1);
	const onhitlquickstart = fn();
</script>

<Story name="With Dependencies [play: nodes visible]" play={playNodesVisible}>
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView
					issues={allIssues}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					{onhitlquickstart}
				/>
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

<Story name="View Mode Switcher [play: tabs switch view]" play={playViewModeSwitcher}>
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView
					issues={allIssues}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					{onhitlquickstart}
				/>
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

<Story name="Filter Bar Toggles [play: filter toggles nodes]" play={playFilterBarToggles}>
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView
					issues={allIssues}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					{onhitlquickstart}
				/>
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

<Story name="Node Select [play: node selected state]" play={playNodeSelect}>
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView
					issues={allIssues}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					{onhitlquickstart}
				/>
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty Graph [play: empty state message]" play={playEmptyState}>
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView issues={[]} dependencies={[]} {onhitlquickstart} />
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

<Story name="Single Isolated Node">
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView issues={singleIssue} dependencies={[]} {onhitlquickstart} />
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

<Story name="Many Dependencies">
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView
					issues={allIssues}
					dependencies={[
						...MOCK_ISSUE_DEPENDENCIES,
						...MOCK_ISSUE_DEPENDENCIES.map((dep, index) => ({
							...dep,
							id: `extra-dep-${index}`,
							blocker_issue_id: dep.blocked_issue_id,
							blocked_issue_id: dep.blocker_issue_id,
						})),
					]}
					{onhitlquickstart}
				/>
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

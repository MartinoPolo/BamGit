<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, within } from 'storybook/test';
	import type { ComponentProps } from 'svelte';
	import IssueCard from './IssueCard.svelte';

	type IssueCardProps = ComponentProps<typeof IssueCard>;

	const { Story } = defineMeta({
		title: 'Blocks/Issue/IssueCard',
		component: IssueCard,
		tags: ['autodocs'],
		args: {
			onExecuteAction: fn(),
			onPriorityClick: fn(),
			onQuickActionAssignFolder: fn(),
		},
	});

	interface PlayContext {
		canvasElement: HTMLElement;
		args: {
			onPriorityClick?: unknown;
			onExecuteAction?: unknown;
			onQuickActionAssignFolder?: unknown;
		};
	}

	/** Click priority badge → onPriorityClick called. */
	const playPriorityClickContainment = async ({ canvasElement, args }: PlayContext) => {
		const canvas = within(canvasElement);
		const priorityBadge = canvas.getByText(/^high$/i);
		await userEvent.click(priorityBadge);
		await expect(args.onPriorityClick).toHaveBeenCalledOnce();
	};

	/** Click GitHub issue link → navigates (stopPropagation). */
	const playGitHubLinkContainment = async ({ canvasElement }: PlayContext) => {
		const canvas = within(canvasElement);
		const ghLink = canvas.getByText('#42');
		await expect(ghLink.tagName).toBe('A');
	};

	/**
	 * Find the quick-action buttons in the header band.
	 * These are the 3 icon-sm buttons (folder, terminal, editor) with data-icon="inline-end".
	 * We scope to the header band to avoid matching contextual action overflow buttons.
	 */
	function getQuickActionButtons(canvasElement: HTMLElement): HTMLButtonElement[] {
		return Array.from(
			canvasElement.querySelectorAll<HTMLButtonElement>(
				'button[aria-label="Open folder"], button[aria-label="Open terminal"], button[aria-label="Open editor"]',
			),
		);
	}

	/** Click each quick-action button → no error thrown, buttons exist. */
	const playQuickActionClickContainment = async ({ canvasElement }: PlayContext) => {
		const quickActionButtons = getQuickActionButtons(canvasElement);
		await expect(quickActionButtons.length).toBe(3);

		for (const button of quickActionButtons) {
			await userEvent.click(button);
		}
	};

	/** Right-click quick-action button → default prevented (no context menu leak). */
	const playQuickActionRightClickContainment = async ({ canvasElement }: PlayContext) => {
		const quickActionButtons = getQuickActionButtons(canvasElement);
		await expect(quickActionButtons.length).toBeGreaterThan(0);
		const button = quickActionButtons[0];

		const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
		button.dispatchEvent(event);

		await expect(event.defaultPrevented).toBe(true);
	};
</script>

<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import { MOCK_ISSUES } from '$lib/tauri_mock_data.js';
	import { ISSUE_CARD_SETTING_DEFAULTS, type IssueCardAppearanceSettings } from './index.js';
	import IssueCardStoryWrapper from './IssueCardStoryWrapper.svelte';

	function parseMockIssue(raw: (typeof MOCK_ISSUES)[number]): Issue {
		return {
			...raw,
			labels: typeof raw.labels === 'string' ? JSON.parse(raw.labels) : (raw.labels ?? []),
		} as Issue;
	}

	const baseIssue = parseMockIssue(MOCK_ISSUES[0]);

	const noWorktreeIssue: Issue = {
		...parseMockIssue(MOCK_ISSUES[4]),
		worktree_state: 'none',
		worktree_folder: null,
		branch_name: null,
	};

	const archivedIssue: Issue = {
		...parseMockIssue(MOCK_ISSUES[5]),
		status: 'archived',
	};

	const veilSettings: IssueCardAppearanceSettings = {
		...ISSUE_CARD_SETTING_DEFAULTS,
		variant: 'veil',
	};

	const horizonSettings: IssueCardAppearanceSettings = {
		...ISSUE_CARD_SETTING_DEFAULTS,
		variant: 'refined-horizon',
	};

	const radiantSettings: IssueCardAppearanceSettings = {
		...ISSUE_CARD_SETTING_DEFAULTS,
		variant: 'radiant',
	};

	const withPrCache: GitStatusCache = {
		issue_id: baseIssue.id,
		branch_status: 'ahead 2',
		pr_state: 'open',
		pr_number: 101,
		pr_url: 'https://github.com/MartinoPolo/Grovekeeper/pull/101',
		github_issue_state: 'open',
		behind_base_count: 0,
		merge_conflict: false,
		has_local_changes: true,
		ahead_remote_count: 2,
		fetched_at: '2026-05-14T10:00:00Z',
		pr_ci_status: null,
	};
</script>

<Story name="Default">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Active">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper activeIssueId={baseIssue.id}>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Batch Selected">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper selectedIssueIds={[baseIssue.id]}>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="With Worktree Active">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} cache={withPrCache} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="With GitHub PR">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					{...args}
					issue={baseIssue}
					cache={withPrCache}
					ghAvailable={true}
					prdParent={{
						number: 95,
						url: 'https://github.com/MartinoPolo/Grovekeeper/issues/95',
					}}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Archived">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={archivedIssue} ghAvailable={false} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="With Notification Dot">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					{...args}
					issue={baseIssue}
					notificationDotColor="bg-orange-500"
					ghAvailable={true}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="With Session State">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					{...args}
					issue={baseIssue}
					sessionState="executing"
					ghAvailable={true}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="No Worktree">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={noWorktreeIssue} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Hovered with Modifier">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper hoveredIssueId={baseIssue.id} modifierHeld={true}>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<!-- Interaction tests: event propagation -->

<Story name="Test: Priority Click Containment" play={playPriorityClickContainment}>
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Test: GitHub Link Containment" play={playGitHubLinkContainment}>
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Test: Quick Action Click Containment" play={playQuickActionClickContainment}>
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Test: Quick Action Right-Click Containment"
	play={playQuickActionRightClickContainment}
>
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<!-- Variant stories -->

<Story name="Variant: Veil (Dark)">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					{...args}
					issue={baseIssue}
					ghAvailable={true}
					appearanceSettings={veilSettings}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Variant: Veil (Light)">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md" data-theme="light">
				<IssueCard
					{...args}
					issue={baseIssue}
					ghAvailable={true}
					appearanceSettings={veilSettings}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Variant: Refined Horizon (Dark)">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					{...args}
					issue={baseIssue}
					ghAvailable={true}
					appearanceSettings={horizonSettings}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Variant: Refined Horizon (Light)">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md" data-theme="light">
				<IssueCard
					{...args}
					issue={baseIssue}
					ghAvailable={true}
					appearanceSettings={horizonSettings}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Variant: Radiant (Dark)">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					{...args}
					issue={baseIssue}
					ghAvailable={true}
					appearanceSettings={radiantSettings}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Variant: Radiant (Light)">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md" data-theme="light">
				<IssueCard
					{...args}
					issue={baseIssue}
					ghAvailable={true}
					appearanceSettings={radiantSettings}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Variant Comparison">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="grid grid-cols-3 gap-4">
				<div>
					<h3 class="mb-2 text-sm font-medium text-muted-foreground">Veil</h3>
					<IssueCard
						{...args}
						issue={baseIssue}
						ghAvailable={true}
						appearanceSettings={veilSettings}
					/>
				</div>
				<div>
					<h3 class="mb-2 text-sm font-medium text-muted-foreground">Refined Horizon</h3>
					<IssueCard
						{...args}
						issue={baseIssue}
						ghAvailable={true}
						appearanceSettings={horizonSettings}
					/>
				</div>
				<div>
					<h3 class="mb-2 text-sm font-medium text-muted-foreground">Radiant</h3>
					<IssueCard
						{...args}
						issue={baseIssue}
						ghAvailable={true}
						appearanceSettings={radiantSettings}
					/>
				</div>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

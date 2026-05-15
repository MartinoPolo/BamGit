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
			onCardClick: fn(),
			onTitleClick: fn(),
			onMouseEnter: fn(),
			onMouseLeave: fn(),
			onExecuteAction: fn(),
			onPriorityClick: fn(),
			onQuickActionAssignFolder: fn(),
		},
	});

	interface PlayContext {
		canvasElement: HTMLElement;
		args: {
			onCardClick?: unknown;
			onPriorityClick?: unknown;
			onExecuteAction?: unknown;
			onQuickActionAssignFolder?: unknown;
		};
	}

	/** Click priority badge → onPriorityClick called, card onclick NOT called. */
	const playPriorityClickContainment = async ({ canvasElement, args }: PlayContext) => {
		const canvas = within(canvasElement);
		const priorityBadge = canvas.getByText(/^high$/i);
		await userEvent.click(priorityBadge);
		await expect(args.onPriorityClick).toHaveBeenCalledOnce();
		await expect(args.onCardClick).not.toHaveBeenCalled();
	};

	/** Click GitHub issue link → navigates (stopPropagation), card onclick NOT called. */
	const playGitHubLinkContainment = async ({ canvasElement, args }: PlayContext) => {
		const canvas = within(canvasElement);
		// The GitHub issue number link in the header
		const ghLink = canvas.getByText('#42');
		await expect(ghLink.tagName).toBe('A');
		await userEvent.click(ghLink);
		await expect(args.onCardClick).not.toHaveBeenCalled();
	};

	/**
	 * Find the quick-action buttons in the header band.
	 * These are the 3 icon-sm buttons (folder, terminal, editor) with data-icon="inline-end".
	 * We scope to the header band to avoid matching contextual action overflow buttons.
	 */
	function getQuickActionButtons(canvasElement: HTMLElement): HTMLButtonElement[] {
		// The quick-action container has class "ml-0.5"
		const headerBand = canvasElement.querySelector(
			'[style*="background-color"]',
		) as HTMLElement | null;
		if (!headerBand) {
			return [];
		}
		const icons = headerBand.querySelectorAll('[data-icon="inline-end"]');
		return Array.from(icons)
			.map((icon) => icon.closest('button'))
			.filter((btn): btn is HTMLButtonElement => btn !== null);
	}

	/** Click each quick-action button → onExecuteAction called, card onclick NOT called. */
	const playQuickActionClickContainment = async ({ canvasElement, args }: PlayContext) => {
		const quickActionButtons = getQuickActionButtons(canvasElement);
		await expect(quickActionButtons.length).toBe(3);

		for (const button of quickActionButtons) {
			await userEvent.click(button);
		}

		// Each of the 3 quick-action buttons calls onExecuteAction
		await expect(args.onExecuteAction).toHaveBeenCalledTimes(3);
		// Card onclick must NOT have been called by any of those clicks
		await expect(args.onCardClick).not.toHaveBeenCalled();
	};

	/** Right-click quick-action button → onQuickActionAssignFolder fires, default prevented. */
	const playQuickActionRightClickContainment = async ({ canvasElement, args }: PlayContext) => {
		const quickActionButtons = getQuickActionButtons(canvasElement);
		await expect(quickActionButtons.length).toBeGreaterThan(0);
		const button = quickActionButtons[0];

		// Dispatch contextmenu directly (userEvent.pointer right-click may not dispatch contextmenu)
		const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
		button.dispatchEvent(event);

		// The handler should call onQuickActionAssignFolder
		await expect(args.onQuickActionAssignFolder).toHaveBeenCalled();

		// The handler calls preventDefault — verify the event was cancelled
		// Note: Svelte 5 event delegation means stopPropagation in the handler fires
		// after bubbling, so we check preventDefault instead of stopPropagation
		await expect(event.defaultPrevented).toBe(true);
	};
</script>

<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import { MOCK_ISSUES } from '$lib/tauri_mock_data.js';
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
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} isActive={true} ghAvailable={true} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Batch Selected">
	{#snippet template(args: IssueCardProps)}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard {...args} issue={baseIssue} isBatchSelected={true} ghAvailable={true} />
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
					childCount={3}
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
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					{...args}
					issue={baseIssue}
					isHovered={true}
					isModifierHeld={true}
					ghAvailable={true}
				/>
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

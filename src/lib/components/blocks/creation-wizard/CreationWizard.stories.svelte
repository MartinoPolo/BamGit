<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CreationWizard from './CreationWizard.svelte';
	import CreationWizardStoryWrapper from './CreationWizardStoryWrapper.svelte';
	import {
		playOpensAtStep1,
		playSearchListVisible,
		playEnterAdvancesToStep2,
		playBackspaceGoesBack,
		playEscapeContainment,
		playEscapeFromStep2,
	} from './creation_wizard_stories_play.js';

	const { Story } = defineMeta({
		title: 'Blocks/CreationWizard/CreationWizard',
		component: CreationWizard,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import type { Issue } from '$lib/modules/issues';
	import { MOCK_ASSIGNED_ISSUES_RESULT } from '$lib/tauri_mock_data.js';
	import { WIZARD_STEPS } from '$lib/modules/creation-wizard/types.js';

	const mockIssue: Issue = {
		id: 'mock-created-issue',
		dashboard_id: 'mock-dashboard-grovekeeper',
		name: 'Mock Created Issue',
		priority: 'medium',
		color: '#f97316',
		status: 'active',
		github_issue_url: null,
		github_issue_number: null,
		branch_name: 'mock-issue-branch',
		base_branch: 'dev',
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: [],
		sort_order: 0,
		created_at: '2026-05-14T10:00:00Z',
		character_pack_id: null,
		character_avatar: null,
		is_sound_muted: false,
	};

	const assignedIssues = MOCK_ASSIGNED_ISSUES_RESULT.issues;

	const mockOnCreate = fn().mockResolvedValue(mockIssue);
	const mockOnUpdate = fn().mockResolvedValue(mockIssue);
	const mockOnSetupWorktree = fn().mockResolvedValue(undefined);
</script>

<Story name="Default (GitHub Search)" play={playOpensAtStep1}>
	{#snippet template()}
		<CreationWizardStoryWrapper>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

<Story name="Search List Visible" play={playSearchListVisible}>
	{#snippet template()}
		<CreationWizardStoryWrapper>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

<Story name="Enter Advances to Step 2" play={playEnterAdvancesToStep2}>
	{#snippet template()}
		<CreationWizardStoryWrapper>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

<Story name="Backspace Goes Back" play={playBackspaceGoesBack}>
	{#snippet template()}
		<CreationWizardStoryWrapper initialStep={WIZARD_STEPS.ISSUE_NAME}>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

<Story name="Escape Containment (Step 1)" play={playEscapeContainment}>
	{#snippet template()}
		<CreationWizardStoryWrapper>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

<Story name="Escape Containment (Step 2)" play={playEscapeFromStep2}>
	{#snippet template()}
		<CreationWizardStoryWrapper initialStep={WIZARD_STEPS.ISSUE_NAME}>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

<Story name="Step: Issue Name">
	{#snippet template()}
		<CreationWizardStoryWrapper initialStep={WIZARD_STEPS.ISSUE_NAME}>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

<Story name="Step: Worktree Choice">
	{#snippet template()}
		<CreationWizardStoryWrapper initialStep={WIZARD_STEPS.WORKTREE_CHOICE}>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

<Story name="Step: Color Selection">
	{#snippet template()}
		<CreationWizardStoryWrapper initialStep={WIZARD_STEPS.COLOR_SELECTION}>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

<Story name="Closed">
	{#snippet template()}
		<CreationWizardStoryWrapper openOnMount={false}>
			<CreationWizard
				{assignedIssues}
				onCreate={mockOnCreate}
				onUpdate={mockOnUpdate}
				onSetupWorktree={mockOnSetupWorktree}
			/>
		</CreationWizardStoryWrapper>
	{/snippet}
</Story>

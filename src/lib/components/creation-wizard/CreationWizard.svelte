<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { useCreationWizard, WIZARD_STEPS } from '$lib/modules/creation-wizard';
	import type {
		CreateIssueRequest,
		UpdateIssueRequest,
		Issue,
		WorktreeState,
	} from '$lib/modules/issues';
	import type { AssignedIssue } from '$lib/types/generated';
	import { buildCreateIssueRequest } from '$lib/components/dialog_helpers.js';
	import StepGithubSearch from './StepGithubSearch.svelte';
	import StepIssueName from './StepIssueName.svelte';
	import StepWorktreeChoice from './StepWorktreeChoice.svelte';
	import StepColorSelection from './StepColorSelection.svelte';
	import StepWorktreeProgress from './StepWorktreeProgress.svelte';

	interface Props {
		assignedIssues: AssignedIssue[];
		onCreate: (request: CreateIssueRequest) => Promise<Issue>;
		onUpdate: (request: UpdateIssueRequest) => Promise<Issue>;
		onSetupWorktree: (issue: Issue) => Promise<void>;
	}

	let { assignedIssues, onCreate, onUpdate, onSetupWorktree }: Props = $props();

	const wizard = useCreationWizard();

	let worktreeProgressState = $state<WorktreeState>('none');
	let createdIssue = $state<Issue | null>(null);

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			wizard.closeWizard();
		}
	}

	function isEmptyInputFocused(): boolean {
		const el = document.activeElement;
		const isInput = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA';
		return isInput && (el as HTMLInputElement).value === '';
	}

	function handleBackspace(event: KeyboardEvent) {
		const isInput =
			document.activeElement?.tagName === 'INPUT' ||
			document.activeElement?.tagName === 'TEXTAREA';

		if (
			!isInput ||
			(isEmptyInputFocused() && wizard.currentStep !== WIZARD_STEPS.GITHUB_SEARCH)
		) {
			event.preventDefault();
			wizard.goBack();
		}
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (!wizard.open) {
			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			wizard.closeWizard();
		} else if (event.key === 'Backspace') {
			handleBackspace(event);
		}
	}

	function handleMouseBack(event: MouseEvent) {
		if (wizard.open && event.button === 3) {
			event.preventDefault();
			wizard.goBack();
		}
	}

	async function startWorktreeSetup(issue: Issue) {
		worktreeProgressState = 'pending';
		try {
			await onSetupWorktree(issue);
			worktreeProgressState = 'active';
		} catch {
			worktreeProgressState = 'failed';
		}
	}

	async function handleConfirmColor() {
		const data = wizard.formData;
		const deps = wizard.dependencies;

		const request = buildCreateIssueRequest(
			deps.dashboardId,
			data.issueName,
			data.selectedColor,
			'medium',
			data.githubIssueUrl,
		);

		if (request === null) {
			return;
		}

		try {
			const issue = await onCreate(request);
			createdIssue = issue;

			if (data.branchName && data.githubIssueNumber !== null) {
				await onUpdate({
					id: issue.id,
					branch_name: data.branchName,
					base_branch: deps.defaultBaseBranch,
				});
			}

			if (data.createWorktree && issue.branch_name !== null) {
				await startWorktreeSetup(issue);
			} else {
				wizard.closeWizard();
			}
		} catch (error) {
			console.error('Failed to create issue:', error);
		}
	}

	async function handleRetryWorktree() {
		if (createdIssue === null) {
			return;
		}
		worktreeProgressState = 'pending';
		try {
			await onSetupWorktree(createdIssue);
			worktreeProgressState = 'active';
		} catch {
			worktreeProgressState = 'failed';
		}
	}

	function handleProgressClose() {
		worktreeProgressState = 'none';
		createdIssue = null;
		wizard.closeWizard();
	}

	const stepLabel = $derived.by(() => {
		switch (wizard.currentStep) {
			case WIZARD_STEPS.GITHUB_SEARCH:
				return m.wizard_step_search();
			case WIZARD_STEPS.ISSUE_NAME:
				return m.wizard_step_name();
			case WIZARD_STEPS.WORKTREE_CHOICE:
				return m.wizard_step_worktree();
			case WIZARD_STEPS.COLOR_SELECTION:
				return m.wizard_step_color();
			case WIZARD_STEPS.WORKTREE_PROGRESS:
				return m.wizard_step_progress();
			default:
				return '';
		}
	});

	const showConfirmButton = $derived(wizard.currentStep === WIZARD_STEPS.COLOR_SELECTION);
	const showWorktreeProgress = $derived(
		wizard.currentStep === WIZARD_STEPS.COLOR_SELECTION && worktreeProgressState !== 'none',
	);
</script>

<svelte:window onkeydown={handleGlobalKeydown} onmouseup={handleMouseBack} />

<Dialog.Root open={wizard.open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="top-[15%] -translate-y-0 max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="text-sm font-medium text-muted-foreground">
				{stepLabel}
			</Dialog.Title>
		</Dialog.Header>

		<Dialog.Body class="flex flex-col gap-3 py-2">
			{#if showWorktreeProgress}
				<StepWorktreeProgress
					worktreeState={worktreeProgressState}
					onRetry={handleRetryWorktree}
					onClose={handleProgressClose}
				/>
			{:else if wizard.currentStep === WIZARD_STEPS.GITHUB_SEARCH}
				<StepGithubSearch {assignedIssues} />
			{:else if wizard.currentStep === WIZARD_STEPS.ISSUE_NAME}
				<StepIssueName />
			{:else if wizard.currentStep === WIZARD_STEPS.WORKTREE_CHOICE}
				<StepWorktreeChoice />
			{:else if wizard.currentStep === WIZARD_STEPS.COLOR_SELECTION}
				<StepColorSelection />
			{/if}
		</Dialog.Body>

		{#if showConfirmButton && !showWorktreeProgress}
			<Dialog.Footer>
				<Button variant="ghost" type="button" onclick={() => wizard.closeWizard()}>
					{m.btn_cancel()}
				</Button>
				<Button type="button" onclick={handleConfirmColor}>
					{m.wizard_confirm()}
				</Button>
			</Dialog.Footer>
		{/if}

		<div
			class="flex items-center justify-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground/50"
		>
			<span>{m.wizard_hint_enter()}</span>
			<span>{m.wizard_hint_escape()}</span>
			{#if wizard.currentStep !== WIZARD_STEPS.GITHUB_SEARCH}
				<span>{m.wizard_hint_back()}</span>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

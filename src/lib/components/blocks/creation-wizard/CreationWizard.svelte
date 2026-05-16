<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import DeleteIcon from '@lucide/svelte/icons/delete';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { useCreationWizard, WIZARD_STEPS } from '$lib/modules/creation-wizard';
	import type {
		CreateIssueRequest,
		UpdateIssueRequest,
		Issue,
		WorktreeState,
	} from '$lib/modules/issues';
	import type { AssignedIssue } from '$lib/types/generated';
	import { buildCreateIssueRequest } from '$lib/components/blocks/issue/dialog_helpers.js';
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
	let isSubmitting = $state(false);
	let githubSearchRef: ReturnType<typeof StepGithubSearch> | undefined = $state();
	let issueNameRef: ReturnType<typeof StepIssueName> | undefined = $state();
	let worktreeChoiceRef: ReturnType<typeof StepWorktreeChoice> | undefined = $state();
	let colorSelectionRef: ReturnType<typeof StepColorSelection> | undefined = $state();
	let textInputFocused = $state(false);

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			worktreeProgressState = 'none';
			createdIssue = null;
			wizard.closeWizard();
		}
	}

	function isTextInputFocused(): boolean {
		const el = document.activeElement;
		return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA';
	}

	function trackFocus() {
		textInputFocused = isTextInputFocused();
	}

	function handleBackspace(event: KeyboardEvent) {
		if (isTextInputFocused()) {
			return;
		}

		if (wizard.currentStep !== WIZARD_STEPS.GITHUB_SEARCH) {
			event.preventDefault();
			wizard.goBack();
		}
	}

	function handleEscape(event: KeyboardEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (wizard.currentStep === WIZARD_STEPS.GITHUB_SEARCH) {
			wizard.closeWizard();
		} else if (isTextInputFocused()) {
			wizard.goBack();
		} else {
			wizard.closeWizard();
		}
	}

	// fallow-ignore-next-line complexity
	function handleArrowKeys(event: KeyboardEvent) {
		if (isTextInputFocused()) {
			return;
		}

		switch (wizard.currentStep) {
			case WIZARD_STEPS.GITHUB_SEARCH:
				break;
			case WIZARD_STEPS.WORKTREE_CHOICE:
				if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
					event.preventDefault();
					worktreeChoiceRef?.toggleChoice();
				}
				break;
			case WIZARD_STEPS.COLOR_SELECTION:
				if (
					event.key === 'ArrowUp' ||
					event.key === 'ArrowDown' ||
					event.key === 'ArrowLeft' ||
					event.key === 'ArrowRight'
				) {
					event.preventDefault();
					colorSelectionRef?.handleArrow(event.key);
				}
				break;
			case WIZARD_STEPS.ISSUE_NAME:
			case WIZARD_STEPS.WORKTREE_PROGRESS:
				break;
		}
	}

	function handleEnter(event: KeyboardEvent) {
		switch (wizard.currentStep) {
			case WIZARD_STEPS.GITHUB_SEARCH:
				event.preventDefault();
				githubSearchRef?.confirm();
				break;
			case WIZARD_STEPS.ISSUE_NAME:
				event.preventDefault();
				issueNameRef?.confirm();
				break;
			case WIZARD_STEPS.WORKTREE_CHOICE:
				event.preventDefault();
				worktreeChoiceRef?.confirm();
				break;
			case WIZARD_STEPS.COLOR_SELECTION:
				event.preventDefault();
				handleConfirmColor();
				break;
			case WIZARD_STEPS.WORKTREE_PROGRESS:
				break;
		}
	}

	// fallow-ignore-next-line complexity
	function handleGlobalKeydown(event: KeyboardEvent) {
		if (!wizard.open) {
			return;
		}

		if (event.key === 'Escape') {
			handleEscape(event);
		} else if (event.key === 'Backspace') {
			handleBackspace(event);
		} else if (event.key === 'Enter') {
			handleEnter(event);
		} else if (
			event.key === 'ArrowUp' ||
			event.key === 'ArrowDown' ||
			event.key === 'ArrowLeft' ||
			event.key === 'ArrowRight'
		) {
			handleArrowKeys(event);
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

	// fallow-ignore-next-line complexity
	async function handleConfirmColor() {
		if (isSubmitting) {
			return;
		}
		isSubmitting = true;

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
			isSubmitting = false;
			return;
		}

		try {
			const issue = await onCreate(request);
			createdIssue = issue;

			if (data.branchName && data.githubIssueNumber !== null) {
				try {
					await onUpdate({
						id: issue.id,
						branch_name: data.branchName,
						base_branch: deps.defaultBaseBranch,
					});
				} catch (updateError) {
					console.error('Failed to update branch name:', updateError);
				}
			}

			if (data.createWorktree && issue.branch_name !== null) {
				await startWorktreeSetup(issue);
			} else {
				wizard.closeWizard();
			}
		} catch (error) {
			console.error('Failed to create issue:', error);
		} finally {
			isSubmitting = false;
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

	function handleNextClick() {
		switch (wizard.currentStep) {
			case WIZARD_STEPS.GITHUB_SEARCH:
				githubSearchRef?.confirm();
				break;
			case WIZARD_STEPS.ISSUE_NAME:
				issueNameRef?.confirm();
				break;
			case WIZARD_STEPS.WORKTREE_CHOICE:
				worktreeChoiceRef?.confirm();
				break;
			case WIZARD_STEPS.COLOR_SELECTION:
				handleConfirmColor();
				break;
			case WIZARD_STEPS.WORKTREE_PROGRESS:
				break;
		}
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

	const navigableSteps = $derived.by(() => {
		const steps: string[] = [WIZARD_STEPS.GITHUB_SEARCH, WIZARD_STEPS.ISSUE_NAME];
		if (wizard.worktreeAvailable) {
			steps.push(WIZARD_STEPS.WORKTREE_CHOICE);
		}
		steps.push(WIZARD_STEPS.COLOR_SELECTION);
		return steps;
	});
	const currentStepIndex = $derived(navigableSteps.indexOf(wizard.currentStep));

	const isFirstStep = $derived(wizard.currentStep === WIZARD_STEPS.GITHUB_SEARCH);
	const isFinalStep = $derived(wizard.currentStep === WIZARD_STEPS.COLOR_SELECTION);
	const showNextButton = $derived(
		wizard.currentStep === WIZARD_STEPS.GITHUB_SEARCH ||
			wizard.currentStep === WIZARD_STEPS.ISSUE_NAME ||
			wizard.currentStep === WIZARD_STEPS.WORKTREE_CHOICE,
	);
	const showWorktreeProgress = $derived(
		wizard.currentStep === WIZARD_STEPS.COLOR_SELECTION && worktreeProgressState !== 'none',
	);
	const showFooter = $derived(
		!showWorktreeProgress && wizard.currentStep !== WIZARD_STEPS.WORKTREE_PROGRESS,
	);

	const showBackButton = $derived(!isFirstStep);
	const backKbdHint = $derived.by(() => {
		if (textInputFocused) {
			return 'escape' as const;
		}
		return 'backspace' as const;
	});

	const showCancelKbdHint = $derived.by(() => {
		if (isFirstStep) {
			return true;
		}
		return !textInputFocused;
	});

	const navigationHint = $derived.by((): 'vertical' | 'horizontal' | 'grid' | null => {
		switch (wizard.currentStep) {
			case WIZARD_STEPS.GITHUB_SEARCH:
				return 'vertical';
			case WIZARD_STEPS.ISSUE_NAME:
				return null;
			case WIZARD_STEPS.WORKTREE_CHOICE:
				if (textInputFocused) {
					return null;
				}
				return 'horizontal';
			case WIZARD_STEPS.COLOR_SELECTION:
				if (textInputFocused) {
					return null;
				}
				return 'grid';
			default:
				return null;
		}
	});
</script>

<svelte:window
	onkeydown={handleGlobalKeydown}
	onmouseup={handleMouseBack}
	onfocusin={trackFocus}
	onfocusout={trackFocus}
/>

<Dialog.Root open={wizard.open} onOpenChange={handleOpenChange}>
	<Dialog.Content
		class="top-[15%] translate-y-0 max-w-lg"
		onEscapeKeydown={(e) => {
			e.preventDefault();
			e.stopPropagation();
		}}
	>
		<Dialog.Header class="flex items-center">
			<Dialog.Title class="text-base font-semibold text-foreground">
				{stepLabel}
			</Dialog.Title>
			{#if !showWorktreeProgress}
				<div class="ml-auto flex items-center gap-1.25">
					{#each navigableSteps as step, index (step)}
						<div
							class="h-1.5 transition-all duration-200
								{index === currentStepIndex
								? 'w-4 rounded-sm bg-primary'
								: index < currentStepIndex
									? 'w-1.5 rounded-full bg-primary/50'
									: 'w-1.5 rounded-full bg-border-strong'}"
						></div>
					{/each}
				</div>
			{/if}
		</Dialog.Header>

		<Dialog.Body class="flex flex-col gap-3 py-4">
			{#if showWorktreeProgress}
				<StepWorktreeProgress
					worktreeState={worktreeProgressState}
					onRetry={handleRetryWorktree}
					onClose={handleProgressClose}
				/>
			{:else if wizard.currentStep === WIZARD_STEPS.GITHUB_SEARCH}
				<StepGithubSearch bind:this={githubSearchRef} {assignedIssues} />
			{:else if wizard.currentStep === WIZARD_STEPS.ISSUE_NAME}
				<StepIssueName bind:this={issueNameRef} />
			{:else if wizard.currentStep === WIZARD_STEPS.WORKTREE_CHOICE}
				<StepWorktreeChoice bind:this={worktreeChoiceRef} />
			{:else if wizard.currentStep === WIZARD_STEPS.COLOR_SELECTION}
				<StepColorSelection bind:this={colorSelectionRef} onConfirm={handleConfirmColor} />
			{/if}
		</Dialog.Body>

		{#if showFooter}
			<Dialog.Footer class="flex items-center">
				{#if showBackButton}
					<Button intent="ghost" type="button" onclick={() => wizard.goBack()}>
						{m.wizard_back()}
						{#if backKbdHint === 'escape'}
							<Kbd>Esc</Kbd>
						{:else}
							<Kbd format="lucide"><DeleteIcon /></Kbd>
						{/if}
					</Button>
				{/if}
				<div class="flex flex-1 items-center justify-center">
					{#if navigationHint === 'vertical'}
						<span class="flex items-center gap-1.5 text-xs text-muted-foreground/60">
							{m.wizard_navigate()}
							<Kbd format="lucide"><ArrowUpIcon /><ArrowDownIcon /></Kbd>
						</span>
					{:else if navigationHint === 'horizontal'}
						<span class="flex items-center gap-1.5 text-xs text-muted-foreground/60">
							{m.wizard_navigate()}
							<Kbd format="lucide"><ArrowLeftIcon /><ArrowRightIcon /></Kbd>
						</span>
					{:else if navigationHint === 'grid'}
						<span class="flex items-center gap-1.5 text-xs text-muted-foreground/60">
							{m.wizard_navigate()}
							<Kbd format="lucide"
								><ArrowUpIcon /><ArrowDownIcon /><ArrowLeftIcon /><ArrowRightIcon
								/></Kbd
							>
						</span>
					{/if}
				</div>
				<Button intent="ghost" type="button" onclick={() => wizard.closeWizard()}>
					{m.btn_cancel()}
					{#if showCancelKbdHint}
						<Kbd>Esc</Kbd>
					{/if}
				</Button>
				{#if showNextButton}
					<Button type="button" onclick={handleNextClick}>
						{m.wizard_next()}
						<Kbd format="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
					</Button>
				{/if}
				{#if isFinalStep}
					<Button type="button" onclick={handleConfirmColor} disabled={isSubmitting}>
						{m.wizard_confirm()}
						<Kbd format="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
					</Button>
				{/if}
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

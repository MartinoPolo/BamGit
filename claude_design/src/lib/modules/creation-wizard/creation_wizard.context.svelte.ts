import { createContext } from 'svelte';
import { invoke } from '$lib/tauri.js';
import type { AssignedIssue } from '$lib/types/generated';
import { generateBranchName, generateIssueName } from './smart_naming.js';
import {
	WIZARD_STEPS,
	type WizardStep,
	type WizardFormData,
	type WizardDependencies,
	type SearchedGithubIssue,
} from './types.js';

// ─── Context ────────────────────────────────────────────────────────────────

type CreationWizardContext = ReturnType<typeof createCreationWizardContext>;

const [useCreationWizard, setCreationWizardInternal] = createContext<CreationWizardContext>();
export { useCreationWizard };

export function setCreationWizardContext() {
	const ctx = createCreationWizardContext();
	setCreationWizardInternal(ctx);
	return ctx;
}

// ─── Factory ────────────────────────────────────────────────────────────────

const SEARCH_DEBOUNCE_MS = 300;

function emptyFormData(): WizardFormData {
	return {
		selectedGithubIssue: null,
		issueName: '',
		branchName: '',
		createWorktree: false,
		selectedColor: '',
		githubIssueUrl: '',
		githubIssueNumber: null,
	};
}

const EMPTY_DEPENDENCIES: WizardDependencies = {
	dashboardId: '',
	paletteColors: [],
	usedColors: [],
	nextAvailableColor: '',
	isDarkMode: false,
	localFolder: null,
	defaultBaseBranch: null,
	githubRepo: null,
	assignedIssues: [],
};

function createCreationWizardContext() {
	let open = $state(false);
	let currentStep = $state<WizardStep>(WIZARD_STEPS.GITHUB_SEARCH);
	let formData = $state<WizardFormData>(emptyFormData());
	let deps = $state<WizardDependencies>(EMPTY_DEPENDENCIES);

	let searchQuery = $state('');
	let searchResults = $state<SearchedGithubIssue[]>([]);
	let searching = $state(false);
	let searchAbortController: AbortController | null = null;
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	let skipNotice = $state(false);

	const worktreeAvailable = $derived(deps.localFolder !== null);

	function computeStepSequence(): WizardStep[] {
		const steps: WizardStep[] = [WIZARD_STEPS.GITHUB_SEARCH, WIZARD_STEPS.ISSUE_NAME];
		if (worktreeAvailable) {
			steps.push(WIZARD_STEPS.WORKTREE_CHOICE);
		}
		steps.push(WIZARD_STEPS.COLOR_SELECTION);
		return steps;
	}

	function reset(dependencies: WizardDependencies) {
		deps = dependencies;
		currentStep = WIZARD_STEPS.GITHUB_SEARCH;
		formData = emptyFormData();
		formData.selectedColor = dependencies.nextAvailableColor;
		searchQuery = '';
		searchResults = [];
		searching = false;
		skipNotice = false;
		cancelSearch();
	}

	function cancelSearch() {
		if (searchDebounceTimer !== null) {
			clearTimeout(searchDebounceTimer);
			searchDebounceTimer = null;
		}
		if (searchAbortController !== null) {
			searchAbortController.abort();
			searchAbortController = null;
		}
	}

	async function executeSearch(query: string) {
		if (deps.githubRepo === null) {
			searchResults = [];
			searching = false;
			return;
		}

		searchAbortController = new AbortController();
		const signal = searchAbortController.signal;

		try {
			searching = true;
			const results = await invoke<SearchedGithubIssue[]>('search_github_issues', {
				owner: deps.githubRepo.owner,
				repo: deps.githubRepo.repo,
				query,
			});

			if (!signal.aborted) {
				searchResults = results;
			}
		} catch (error) {
			if (!signal.aborted) {
				searchResults = [];
				console.error('GitHub issue search failed:', error);
			}
		} finally {
			if (!signal.aborted) {
				searching = false;
			}
		}
	}

	function advanceToStep(step: WizardStep) {
		currentStep = step;
	}

	function nextStep() {
		const sequence = computeStepSequence();
		const currentIndex = sequence.indexOf(currentStep);
		if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
			currentStep = sequence[currentIndex + 1];
		}
	}

	function previousStep() {
		const sequence = computeStepSequence();
		const currentIndex = sequence.indexOf(currentStep);
		if (currentIndex > 0) {
			currentStep = sequence[currentIndex - 1];
		}
	}

	return {
		get open() {
			return open;
		},
		get currentStep() {
			return currentStep;
		},
		get formData() {
			return formData;
		},
		get searchQuery() {
			return searchQuery;
		},
		get searchResults() {
			return searchResults;
		},
		get searching() {
			return searching;
		},
		get skipNotice() {
			return skipNotice;
		},
		get worktreeAvailable() {
			return worktreeAvailable;
		},
		get dependencies() {
			return deps;
		},

		openWizard(dependencies: WizardDependencies) {
			reset(dependencies);
			open = true;
		},

		openWizardWithPreselectedIssue(
			dependencies: WizardDependencies,
			assignedIssue: AssignedIssue,
		) {
			reset(dependencies);
			formData.selectedGithubIssue = {
				number: assignedIssue.number,
				title: assignedIssue.title,
				state: assignedIssue.state,
				url: assignedIssue.url,
			};
			formData.githubIssueUrl = assignedIssue.url;
			formData.githubIssueNumber = assignedIssue.number;
			formData.issueName = generateIssueName(assignedIssue.number, assignedIssue.title);
			formData.branchName = generateBranchName(assignedIssue.number, assignedIssue.title);
			currentStep = WIZARD_STEPS.ISSUE_NAME;
			open = true;
		},

		closeWizard() {
			cancelSearch();
			open = false;
		},

		updateSearchQuery(query: string) {
			searchQuery = query;
			skipNotice = false;
			cancelSearch();

			if (query.trim() === '') {
				searchResults = [];
				searching = false;
				return;
			}

			searchDebounceTimer = setTimeout(() => {
				void executeSearch(query.trim());
			}, SEARCH_DEBOUNCE_MS);
		},

		selectGithubIssue(issue: SearchedGithubIssue) {
			formData.selectedGithubIssue = issue;
			formData.githubIssueUrl = issue.url;
			formData.githubIssueNumber = issue.number;
			formData.issueName = generateIssueName(issue.number, issue.title);
			formData.branchName = generateBranchName(issue.number, issue.title);
			cancelSearch();
			advanceToStep(WIZARD_STEPS.ISSUE_NAME);
		},

		skipGithubSearch() {
			formData.selectedGithubIssue = null;
			formData.githubIssueUrl = '';
			formData.githubIssueNumber = null;
			cancelSearch();
			advanceToStep(WIZARD_STEPS.ISSUE_NAME);
		},

		autoAdvanceWithNotice() {
			skipNotice = true;
			setTimeout(() => {
				if (skipNotice) {
					formData.selectedGithubIssue = null;
					formData.githubIssueUrl = '';
					formData.githubIssueNumber = null;
					cancelSearch();
					advanceToStep(WIZARD_STEPS.ISSUE_NAME);
				}
			}, 1500);
		},

		confirmIssueName(name: string, branchName: string) {
			formData.issueName = name;
			formData.branchName = branchName;
			nextStep();
		},

		selectWorktreeChoice(createWorktree: boolean) {
			formData.createWorktree = createWorktree;
			advanceToStep(WIZARD_STEPS.COLOR_SELECTION);
		},

		selectColor(color: string) {
			formData.selectedColor = color;
		},

		goBack() {
			if (currentStep === WIZARD_STEPS.WORKTREE_PROGRESS) {
				advanceToStep(WIZARD_STEPS.COLOR_SELECTION);
				return;
			}
			previousStep();
		},

		buildResult() {
			return formData;
		},
	};
}

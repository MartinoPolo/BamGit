import type {
	CreateIssueRequest,
	UpdateIssueRequest,
	SetupWorktreeRequest,
} from '$lib/modules/issues';
import type { AssignedIssue, SearchedGithubIssue } from '$lib/types/generated';
export type { SearchedGithubIssue } from '$lib/types/generated';

export const WIZARD_STEPS = {
	GITHUB_SEARCH: 'github-search',
	ISSUE_NAME: 'issue-name',
	WORKTREE_CHOICE: 'worktree-choice',
	COLOR_SELECTION: 'color-selection',
	WORKTREE_PROGRESS: 'worktree-progress',
} as const;

export type WizardStep = (typeof WIZARD_STEPS)[keyof typeof WIZARD_STEPS];

export interface WizardFormData {
	selectedGithubIssue: SearchedGithubIssue | null;
	issueName: string;
	branchName: string;
	createWorktree: boolean;
	selectedColor: string;
	githubIssueUrl: string;
	githubIssueNumber: number | null;
}

export interface WizardResult {
	createRequest: CreateIssueRequest;
	updateRequest: UpdateIssueRequest | null;
	setupWorktreeRequest: SetupWorktreeRequest | null;
}

export interface WizardDependencies {
	dashboardId: string;
	paletteColors: string[];
	usedColors: string[];
	nextAvailableColor: string;
	isDarkMode: boolean;
	localFolder: string | null;
	defaultBaseBranch: string | null;
	githubRepo: { owner: string; repo: string } | null;
	assignedIssues: AssignedIssue[];
}

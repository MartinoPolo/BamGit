import type { CreateIssueRequest, UpdateIssueRequest, IssuePriority } from '$lib/modules/issues';
import type { CreateDashboardRequest, UpdateDashboardRequest } from '$lib/modules/board';

function trimOrNull(value: string): string | null {
	const trimmed = value.trim();
	return trimmed || null;
}

export function deriveWorktreeFolder(localFolder: string): string {
	const trimmed = localFolder.replace(/[\\/]+$/, '');
	return trimmed ? `${trimmed}-worktrees` : '';
}

export function extractGitHubIssueNumber(url: string): number | null {
	const match = url.match(/\/issues\/(\d+)/);
	return match !== null ? parseInt(match[1], 10) : null;
}

export function buildCreateIssueRequest(
	dashboardId: string,
	name: string,
	color: string,
	priority: string,
	githubIssueUrl: string,
): CreateIssueRequest | null {
	const trimmedName = name.trim();
	if (!trimmedName) {
		return null;
	}

	const request: CreateIssueRequest = {
		dashboard_id: dashboardId,
		name: trimmedName,
		color,
	};

	if (priority) {
		request.priority = priority as IssuePriority;
	}

	const trimmedUrl = trimOrNull(githubIssueUrl);
	if (trimmedUrl !== null) {
		request.github_issue_url = trimmedUrl;
		const issueNumber = extractGitHubIssueNumber(trimmedUrl);
		if (issueNumber !== null) {
			request.github_issue_number = issueNumber;
		}
	}

	return request;
}

export function buildUpdateIssueRequest(
	issueId: string | null,
	name: string,
	priority: string,
	color: string,
	githubIssueUrl: string,
): UpdateIssueRequest | null {
	if (issueId === null || !name.trim()) {
		return null;
	}

	return {
		id: issueId,
		name: name.trim(),
		priority: (priority as IssuePriority) || null,
		color: color || null,
		github_issue_url: trimOrNull(githubIssueUrl),
	};
}

export function buildCreateDashboardRequest(
	name: string,
	accentColor: string,
	githubRepo: string,
	localFolder: string,
	defaultBaseBranch: string,
	worktreeParentFolder: string,
): CreateDashboardRequest | null {
	const trimmedName = name.trim();
	if (!trimmedName) {
		return null;
	}

	return {
		name: trimmedName,
		type: 'repo',
		accent_color: accentColor,
		github_repo: trimOrNull(githubRepo) ?? undefined,
		local_folder: trimOrNull(localFolder) ?? undefined,
		default_base_branch: trimOrNull(defaultBaseBranch) ?? undefined,
		worktree_parent_folder: trimOrNull(worktreeParentFolder) ?? undefined,
	};
}

export function buildUpdateDashboardRequest(
	dashboard: { id: string } | null,
	name: string,
	accentColor: string | null,
	githubRepo: string,
	localFolder: string,
	defaultBaseBranch: string,
	worktreeParentFolder: string,
): UpdateDashboardRequest | null {
	if (dashboard === null || !name.trim()) {
		return null;
	}

	return {
		id: dashboard.id,
		name: name.trim(),
		accent_color: accentColor,
		github_repo: trimOrNull(githubRepo),
		local_folder: trimOrNull(localFolder),
		default_base_branch: trimOrNull(defaultBaseBranch),
		worktree_parent_folder: trimOrNull(worktreeParentFolder),
	};
}

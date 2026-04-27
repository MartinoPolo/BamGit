import type { CreateIssueRequest, UpdateIssueRequest, IssuePriority } from '$lib/modules/issues';
import type { CreateDashboardRequest, UpdateDashboardRequest } from '$lib/modules/board';

export function syncDialogVisibility(
	triggerOpen: boolean,
	dialogElement: HTMLDialogElement | undefined,
	onOpen?: () => void,
): void {
	if (triggerOpen && dialogElement !== undefined && !dialogElement.open) {
		onOpen?.();
		dialogElement.showModal();
	} else if (!triggerOpen && dialogElement?.open === true) {
		dialogElement.close();
	}
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

	const trimmedUrl = githubIssueUrl.trim();
	if (trimmedUrl) {
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
		github_issue_url: githubIssueUrl.trim() || null,
	};
}

export function buildCreateDashboardRequest(
	name: string,
	dashboardType: 'repo' | 'portfolio',
	colorPaletteId: string | null,
	githubRepo: string,
	localFolder: string,
	defaultBaseBranch: string,
	worktreeParentFolder: string,
): CreateDashboardRequest | null {
	const trimmedName = name.trim();
	if (!trimmedName) {
		return null;
	}

	const request: CreateDashboardRequest = {
		name: trimmedName,
		type: dashboardType,
	};

	if (colorPaletteId !== null) {
		request.color_palette_id = colorPaletteId;
	}

	if (dashboardType === 'repo') {
		if (githubRepo.trim()) {
			request.github_repo = githubRepo.trim();
		}
		if (localFolder.trim()) {
			request.local_folder = localFolder.trim();
		}
		if (defaultBaseBranch.trim()) {
			request.default_base_branch = defaultBaseBranch.trim();
		}
		if (worktreeParentFolder.trim()) {
			request.worktree_parent_folder = worktreeParentFolder.trim();
		}
	}

	return request;
}

export function buildUpdateDashboardRequest(
	dashboard: { id: string; type: string } | null,
	name: string,
	colorPaletteId: string | null,
	githubRepo: string,
	localFolder: string,
	defaultBaseBranch: string,
	worktreeParentFolder: string,
): UpdateDashboardRequest | null {
	if (dashboard === null || !name.trim()) {
		return null;
	}

	const request: UpdateDashboardRequest = {
		id: dashboard.id,
		name: name.trim(),
		color_palette_id: colorPaletteId,
	};

	if (dashboard.type === 'repo') {
		request.github_repo = githubRepo.trim() || null;
		request.local_folder = localFolder.trim() || null;
		request.default_base_branch = defaultBaseBranch.trim() || null;
		request.worktree_parent_folder = worktreeParentFolder.trim() || null;
	}

	return request;
}

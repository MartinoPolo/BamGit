export interface GitHubRepo {
	name: string;
	owner: string;
	description: string | null;
	is_private: boolean;
}

export function repoFullName(repo: GitHubRepo): string {
	return `${repo.owner}/${repo.name}`;
}

export function filterRepos(repos: readonly GitHubRepo[], query: string): GitHubRepo[] {
	const lower = query.toLowerCase();
	return repos.filter(
		(repo) =>
			repo.name.toLowerCase().includes(lower) ||
			repo.owner.toLowerCase().includes(lower) ||
			repoFullName(repo).toLowerCase().includes(lower),
	);
}

export function sortReposWithRecent(
	repos: readonly GitHubRepo[],
	recentFullNames: readonly string[],
): GitHubRepo[] {
	const recentSet = new Set(recentFullNames.map((name) => name.toLowerCase()));
	const recent: GitHubRepo[] = [];
	const rest: GitHubRepo[] = [];
	for (const repo of repos) {
		if (recentSet.has(repoFullName(repo).toLowerCase())) {
			recent.push(repo);
		} else {
			rest.push(repo);
		}
	}
	return [...recent, ...rest];
}

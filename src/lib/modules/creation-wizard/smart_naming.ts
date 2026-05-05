const CONVENTIONAL_COMMIT_PREFIX_REGEX =
	/^(feat|fix|chore|docs|refactor|style|test|perf|ci|build)(\([^)]*\))?:\s*/i;

const FILLER_WORDS = new Set([
	'the',
	'a',
	'an',
	'and',
	'or',
	'but',
	'in',
	'on',
	'at',
	'to',
	'for',
	'of',
	'with',
	'by',
	'is',
	'are',
	'was',
	'were',
	'be',
	'been',
	'being',
	'have',
	'has',
	'had',
	'do',
	'does',
	'did',
	'will',
	'would',
	'shall',
	'should',
	'may',
	'might',
	'must',
	'can',
	'could',
	'this',
	'that',
	'it',
	'not',
]);

const BRANCH_MAX_LENGTH = 50;

function stripConventionalCommitPrefix(title: string): string {
	return title.replace(CONVENTIONAL_COMMIT_PREFIX_REGEX, '').trim();
}

function stripGithubIssueReferences(title: string): string {
	return title.replace(/#\d+\s*/g, '').trim();
}

function stripFillerWords(words: readonly string[]): string[] {
	return words.filter((word) => !FILLER_WORDS.has(word.toLowerCase()));
}

function toGitSafeSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/[\s-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function truncateAtWordBoundary(slug: string, maxLength: number): string {
	if (slug.length <= maxLength) {
		return slug;
	}

	const truncated = slug.slice(0, maxLength);
	const lastDashIndex = truncated.lastIndexOf('-');

	if (lastDashIndex === -1) {
		return truncated;
	}

	return truncated.slice(0, lastDashIndex);
}

export function generateBranchName(issueNumber: number, title: string): string {
	const withoutPrefix = stripConventionalCommitPrefix(title);
	const withoutIssueRefs = stripGithubIssueReferences(withoutPrefix);

	const words = withoutIssueRefs.split(/\s+/).filter((word) => word.length > 0);
	const meaningfulWords = stripFillerWords(words);

	if (meaningfulWords.length === 0) {
		return String(issueNumber);
	}

	const joined = meaningfulWords.join(' ');
	const slug = toGitSafeSlug(joined);

	if (!slug) {
		return String(issueNumber);
	}

	const prefix = `${issueNumber}-`;
	const availableLength = BRANCH_MAX_LENGTH - prefix.length;
	const truncatedSlug = truncateAtWordBoundary(slug, availableLength);

	if (!truncatedSlug) {
		return String(issueNumber);
	}

	return `${prefix}${truncatedSlug}`;
}

function stripTrailingSpecialCharacters(text: string): string {
	return text.replace(/[\s,:\-.;—]+$/, '');
}

export function generateIssueName(_issueNumber: number, title: string): string {
	const withoutPrefix = stripConventionalCommitPrefix(title);

	const words = withoutPrefix.split(/\s+/).filter((word) => word.length > 0);

	if (words.length === 0) {
		return '';
	}

	const firstFourWords = words.slice(0, 4);
	const joined = firstFourWords.join(' ');

	return stripTrailingSpecialCharacters(joined);
}

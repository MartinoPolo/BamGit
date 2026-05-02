import { describe, it, expect } from 'vitest';
import { generateBranchName, generateIssueName } from './smart_naming.js';

describe('generateBranchName', () => {
	describe('conventional commit prefix stripping', () => {
		it('strips feat: prefix', () => {
			const result = generateBranchName(133, 'feat: add dashboard layout');
			expect(result).toBe('133-add-dashboard-layout');
		});

		it('strips fix: prefix', () => {
			const result = generateBranchName(42, 'fix: login bug');
			expect(result).toBe('42-login-bug');
		});

		it('strips chore: prefix', () => {
			const result = generateBranchName(1, 'chore: update dependencies');
			expect(result).toBe('1-update-dependencies');
		});

		it('strips docs: prefix', () => {
			const result = generateBranchName(5, 'docs: improve readme');
			expect(result).toBe('5-improve-readme');
		});

		it('strips refactor: prefix', () => {
			const result = generateBranchName(7, 'refactor: extract helper functions');
			expect(result).toBe('7-extract-helper-functions');
		});

		it('strips style: prefix', () => {
			const result = generateBranchName(8, 'style: fix indentation');
			expect(result).toBe('8-fix-indentation');
		});

		it('strips test: prefix', () => {
			const result = generateBranchName(9, 'test: add unit tests');
			expect(result).toBe('9-add-unit-tests');
		});

		it('strips perf: prefix', () => {
			const result = generateBranchName(10, 'perf: optimize rendering');
			expect(result).toBe('10-optimize-rendering');
		});

		it('strips ci: prefix', () => {
			const result = generateBranchName(11, 'ci: add pipeline config');
			expect(result).toBe('11-add-pipeline-config');
		});

		it('strips build: prefix', () => {
			const result = generateBranchName(12, 'build: update webpack config');
			expect(result).toBe('12-update-webpack-config');
		});

		it('strips feat(ui): scoped prefix', () => {
			const result = generateBranchName(133, 'feat(ui): add dashboard layout');
			expect(result).toBe('133-add-dashboard-layout');
		});

		it('strips fix(auth): scoped prefix', () => {
			const result = generateBranchName(42, 'fix(auth): resolve token expiry');
			expect(result).toBe('42-resolve-token-expiry');
		});

		it('strips prefix case-insensitively', () => {
			const result = generateBranchName(1, 'FEAT: add feature');
			expect(result).toBe('1-add-feature');
		});
	});

	describe('filler word stripping', () => {
		it('strips "the" from title', () => {
			const result = generateBranchName(1, 'fix the bug');
			expect(result).toBe('1-fix-bug');
		});

		it('strips "a" from title', () => {
			const result = generateBranchName(1, 'add a button');
			expect(result).toBe('1-add-button');
		});

		it('strips multiple filler words', () => {
			const result = generateBranchName(1, 'add the new button to the form');
			expect(result).toBe('1-add-new-button-form');
		});

		it('strips "and", "or", "but" conjunctions', () => {
			const result = generateBranchName(1, 'login and logout flow');
			expect(result).toBe('1-login-logout-flow');
		});

		it('strips prepositions: in, on, at, to, for, of, with, by', () => {
			const result = generateBranchName(1, 'listen for events in component');
			expect(result).toBe('1-listen-events-component');
		});

		it('strips linking verbs: is, are, was, were, be, been, being', () => {
			const result = generateBranchName(1, 'status is updated correctly');
			expect(result).toBe('1-status-updated-correctly');
		});

		it('strips auxiliaries: have, has, had', () => {
			const result = generateBranchName(1, 'user has completed onboarding');
			expect(result).toBe('1-user-completed-onboarding');
		});

		it('strips do/does/did', () => {
			const result = generateBranchName(1, 'does not render correctly');
			expect(result).toBe('1-render-correctly');
		});

		it('strips modal verbs: will, would, shall, should, may, might, must, can, could', () => {
			const result = generateBranchName(1, 'user can view dashboard');
			expect(result).toBe('1-user-view-dashboard');
		});

		it('strips demonstratives: this, that, it', () => {
			const result = generateBranchName(1, 'fix this issue with that component');
			expect(result).toBe('1-fix-issue-component');
		});

		it('strips "an" article', () => {
			const result = generateBranchName(1, 'create an account');
			expect(result).toBe('1-create-account');
		});
	});

	describe('issue number prepending', () => {
		it('prepends issue number with dash', () => {
			const result = generateBranchName(133, 'multi-step creation wizard');
			expect(result).toBe('133-multi-step-creation-wizard');
		});

		it('works with single-digit issue numbers', () => {
			const result = generateBranchName(1, 'fix bug');
			expect(result).toBe('1-fix-bug');
		});

		it('works with large issue numbers', () => {
			const result = generateBranchName(9999, 'fix bug');
			expect(result).toBe('9999-fix-bug');
		});
	});

	describe('lowercase conversion', () => {
		it('lowercases the entire output', () => {
			const result = generateBranchName(1, 'Fix Login Bug');
			expect(result).toBe('1-fix-login-bug');
		});

		it('lowercases mixed case title', () => {
			const result = generateBranchName(1, 'Add OAUTH2 Support');
			expect(result).toBe('1-add-oauth2-support');
		});
	});

	describe('spaces to dashes', () => {
		it('converts spaces to dashes', () => {
			const result = generateBranchName(1, 'add new feature');
			expect(result).toBe('1-add-new-feature');
		});

		it('handles multiple consecutive spaces', () => {
			const result = generateBranchName(1, 'add  extra  spaces');
			expect(result).toBe('1-add-extra-spaces');
		});
	});

	describe('non-git-safe character removal', () => {
		it('removes tilde character', () => {
			const result = generateBranchName(1, 'fix~bug');
			expect(result).toBe('1-fixbug');
		});

		it('removes caret character', () => {
			const result = generateBranchName(1, 'fix^bug');
			expect(result).toBe('1-fixbug');
		});

		it('removes colon character', () => {
			const result = generateBranchName(1, 'url:path');
			expect(result).toBe('1-urlpath');
		});

		it('removes backslash character', () => {
			const result = generateBranchName(1, 'fix\\bug');
			expect(result).toBe('1-fixbug');
		});

		it('removes special characters from complex title', () => {
			const result = generateBranchName(133, 'resolve the @#$ bug!');
			expect(result).toBe('133-resolve-bug');
		});

		it('keeps alphanumeric and dashes only', () => {
			const result = generateBranchName(1, 'add feature (v2.0)');
			expect(result).toBe('1-add-feature-v20');
		});
	});

	describe('no consecutive dashes', () => {
		it('collapses multiple dashes into one', () => {
			const result = generateBranchName(1, 'foo--bar');
			expect(result).toBe('1-foo-bar');
		});

		it('collapses dashes that arise from character removal', () => {
			const result = generateBranchName(1, 'foo @#$ bar');
			expect(result).toBe('1-foo-bar');
		});
	});

	describe('no leading or trailing dashes', () => {
		it('removes leading dashes from slug portion', () => {
			const result = generateBranchName(1, '---leading dashes');
			expect(result).toBe('1-leading-dashes');
		});

		it('removes trailing dashes', () => {
			const result = generateBranchName(1, 'trailing dashes---');
			expect(result).toBe('1-trailing-dashes');
		});
	});

	describe('maximum length truncation', () => {
		it('truncates very long title at ~50 chars total', () => {
			const result = generateBranchName(
				133,
				'implement multi-step creation wizard with advanced smart naming capabilities',
			);
			expect(result.length).toBeLessThanOrEqual(50);
		});

		it('does not cut mid-word when truncating', () => {
			const result = generateBranchName(
				133,
				'implement multi-step creation wizard with advanced smart naming',
			);
			// Should not end with a partial word
			const parts = result.split('-');
			// Each segment between dashes should be a complete word or number
			expect(parts.every((part) => part.length > 0)).toBe(true);
		});

		it('truncated result has no trailing dash', () => {
			const result = generateBranchName(
				133,
				'implement multi-step creation wizard with advanced smart naming capabilities for users',
			);
			expect(result).not.toMatch(/-$/);
		});
	});

	describe('edge cases', () => {
		it('returns just issue number string for empty title', () => {
			const result = generateBranchName(133, '');
			expect(result).toBe('133');
		});

		it('returns just issue number when title is all filler words', () => {
			const result = generateBranchName(133, 'the a an and or');
			expect(result).toBe('133');
		});

		it('strips GitHub number reference #42 from start of title', () => {
			const result = generateBranchName(133, '#42 fix login bug');
			expect(result).toBe('133-fix-login-bug');
		});

		it('strips # prefix from issue number reference anywhere it is a standalone word', () => {
			const result = generateBranchName(1, '#99 resolve conflict');
			expect(result).toBe('1-resolve-conflict');
		});

		it('handles title with only special characters', () => {
			const result = generateBranchName(5, '@#$%^&*!');
			expect(result).toBe('5');
		});

		it('handles numeric-only title', () => {
			const result = generateBranchName(1, '2024 release');
			expect(result).toBe('1-2024-release');
		});
	});

	describe('full integration examples', () => {
		it('converts "feat(ui): add dashboard layout" correctly', () => {
			const result = generateBranchName(133, 'feat(ui): add dashboard layout');
			expect(result).toBe('133-add-dashboard-layout');
		});

		it('converts "multi-step creation wizard" correctly', () => {
			const result = generateBranchName(133, 'multi-step creation wizard');
			expect(result).toBe('133-multi-step-creation-wizard');
		});
	});
});

describe('generateIssueName', () => {
	describe('basic formatting', () => {
		it('formats number followed by first four words', () => {
			const result = generateIssueName(
				133,
				'feat: multi-step creation wizard with smart naming',
			);
			expect(result).toBe('133 multi-step creation wizard with');
		});

		it('formats simple title with issue number', () => {
			const result = generateIssueName(42, 'Fix login bug in auth module');
			expect(result).toBe('42 Fix login bug in');
		});

		it('strips conventional commit prefix before taking words', () => {
			const result = generateIssueName(
				133,
				'feat: multi-step creation wizard with smart naming',
			);
			expect(result).toBe('133 multi-step creation wizard with');
		});

		it('strips scoped prefix before taking words', () => {
			const result = generateIssueName(133, 'feat(ui): add dashboard layout for users');
			expect(result).toBe('133 add dashboard layout for');
		});
	});

	describe('preserves original casing', () => {
		it('preserves mixed case', () => {
			const result = generateIssueName(42, 'Fix Login Bug In Auth');
			expect(result).toBe('42 Fix Login Bug In');
		});

		it('preserves uppercase words', () => {
			const result = generateIssueName(1, 'Add OAUTH2 Support For Users');
			expect(result).toBe('1 Add OAUTH2 Support For');
		});

		it('preserves lowercase title', () => {
			const result = generateIssueName(1, 'add new feature for app');
			expect(result).toBe('1 add new feature for');
		});
	});

	describe('fewer than four words', () => {
		it('uses all words when title has fewer than 4 words after prefix stripping', () => {
			const result = generateIssueName(1, 'fix bug');
			expect(result).toBe('1 fix bug');
		});

		it('uses single word when only one word remains after prefix stripping', () => {
			const result = generateIssueName(1, 'feat: refactoring');
			expect(result).toBe('1 refactoring');
		});

		it('returns just number when title is empty after prefix stripping', () => {
			const result = generateIssueName(1, 'feat:');
			expect(result).toBe('1');
		});

		it('uses all words when exactly 4 words', () => {
			const result = generateIssueName(1, 'add new login page');
			expect(result).toBe('1 add new login page');
		});
	});

	describe('no filler word stripping', () => {
		it('preserves filler words in issue name', () => {
			const result = generateIssueName(42, 'Fix the login bug');
			expect(result).toBe('42 Fix the login bug');
		});

		it('preserves "a", "an" articles', () => {
			const result = generateIssueName(1, 'Add a new button for users');
			expect(result).toBe('1 Add a new button');
		});
	});

	describe('edge cases', () => {
		it('returns just the number string for empty title', () => {
			const result = generateIssueName(133, '');
			expect(result).toBe('133');
		});

		it('handles title that is only a conventional prefix with no content', () => {
			const result = generateIssueName(1, 'feat: ');
			expect(result).toBe('1');
		});
	});

	describe('full integration examples', () => {
		it('example from spec: feat: multi-step creation wizard', () => {
			const result = generateIssueName(
				133,
				'feat: multi-step creation wizard with smart naming',
			);
			expect(result).toBe('133 multi-step creation wizard with');
		});

		it('example from spec: Fix login bug in auth module', () => {
			const result = generateIssueName(42, 'Fix login bug in auth module');
			expect(result).toBe('42 Fix login bug in');
		});
	});
});

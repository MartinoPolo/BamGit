#!/usr/bin/env node

// Fixes linked dependency resolution in git worktrees.
//
// Problem: "link:..\\low-poly-2d-trees" resolves relative to the working
// directory. In worktrees this points to the worktree's parent instead of
// the main repo's parent, so the package can't be found.
//
// Fix: detect worktree, find the main repo, create a directory junction
// in the worktree's parent so the relative path resolves correctly.

import { execSync } from 'node:child_process';
import { existsSync, symlinkSync, readlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const LINKED_PACKAGES = ['low-poly-2d-trees'];

const projectRoot = process.cwd();

for (const pkg of LINKED_PACKAGES) {
	const expectedTarget = resolve(projectRoot, '..', pkg);

	if (existsSync(resolve(expectedTarget, 'package.json'))) {
		continue;
	}

	// Already a symlink/junction (possibly dangling from a previous run)
	try {
		readlinkSync(expectedTarget);
		continue;
	} catch {
		// Not a symlink — proceed
	}

	try {
		const gitCommonDir = execSync('git rev-parse --git-common-dir', {
			encoding: 'utf8',
			cwd: projectRoot,
		}).trim();

		const resolvedCommonDir = resolve(projectRoot, gitCommonDir);
		const mainRepoRoot = dirname(resolvedCommonDir);

		if (resolve(mainRepoRoot) === resolve(projectRoot)) {
			console.warn(`[fix-worktree-links] ${pkg} not found at ${expectedTarget}`);
			continue;
		}

		const actualTarget = resolve(mainRepoRoot, '..', pkg);

		if (!existsSync(resolve(actualTarget, 'package.json'))) {
			console.warn(
				`[fix-worktree-links] ${pkg} not found at main repo parent either (${actualTarget})`,
			);
			continue;
		}

		symlinkSync(actualTarget, expectedTarget, 'junction');
		console.log(`[fix-worktree-links] ${expectedTarget} -> ${actualTarget}`);
	} catch (err) {
		console.warn(`[fix-worktree-links] Could not fix ${pkg}: ${err.message}`);
	}
}

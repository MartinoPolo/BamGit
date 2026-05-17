# Phase 6 — Playwright E2E Tests

**Status**: Not started
**Pre-requisite**: None (independent — tests run against browser mock mode, no Tauri needed)
**Estimated sub-agents**: 4 suites
**Run after**: Can run in parallel with other phases
**Run before**: Nothing

---

## Context

Read `.mpx/testing-framework/CONVENTIONS.md` for general conventions and conflict reporting format.

### What these tests cover

Playwright E2E tests run against `pnpm build && pnpm preview` — the full SvelteKit static build served by Vite's preview server. **Tauri is NOT involved.** All `invoke()` calls are intercepted by `src/lib/tauri_mock.ts` automatically, returning fixture data.

This means: navigation, routing, URL state, keyboard shortcuts, tab/focus order, and multi-page workflows are fully testable. Write operations happen against mock state and don't persist across page loads.

### Setup

Current `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
```

**Before writing tests**, update `playwright.config.ts` to add:

- `reuseExistingServer: !process.env.CI` (avoids rebuilding on every test run locally)
- `timeout: 10000` per test (mock responses are instant)
- A shared `baseURL: 'http://localhost:4173'`

Test files go in `tests/e2e/` (currently empty except `.gitkeep`).

### Running

```bash
pnpm test:e2e                # Run all E2E tests
pnpm test:e2e --grep "smoke" # Run only tests matching "smoke"
pnpm test:e2e --headed       # Watch mode
```

### Test File Pattern

```ts
// tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
	test('navigates to sessions page', async ({ page }) => {
		await page.goto('/');
		await page.click('a[href="/sessions"]');
		await expect(page).toHaveURL('/sessions');
		await expect(page.getByRole('heading', { name: /sessions/i })).toBeVisible();
	});
});
```

---

## Suite 1 — Smoke Tests & Navigation (Sub-agent 1)

**File**: `tests/e2e/smoke.spec.ts`
**Purpose**: Verify every route loads without JS errors, correct content visible
**Priority**: 🔴 Critical (first line of defense against regressions)

```ts
test.describe('Smoke — all routes load', () => {
	const routes = ['/', '/sessions', '/settings', '/workspace-settings', '/usage', '/ai-config'];

	for (const route of routes) {
		test(`${route} loads without errors`, async ({ page }) => {
			const errors: string[] = [];
			page.on('pageerror', (err) => errors.push(err.message));
			page.on('console', (msg) => {
				if (msg.type() === 'error') errors.push(msg.text());
			});

			await page.goto(route);
			await page.waitForLoadState('networkidle');
			expect(errors).toHaveLength(0);
		});
	}
});

test.describe('Sidebar navigation', () => {
	test('clicking Sessions nav item navigates to /sessions', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /sessions/i }).click();
		await expect(page).toHaveURL('/sessions');
	});

	test('active nav item is highlighted', async ({ page }) => {
		await page.goto('/sessions');
		const sessionsLink = page.getByRole('link', { name: /sessions/i });
		// Verify the active class or aria-current is set
		await expect(sessionsLink).toHaveAttribute('aria-current', 'page');
		// OR: check CSS class — adapt to actual implementation
	});

	test('navigating to /issues redirects to /', async ({ page }) => {
		await page.goto('/issues');
		await expect(page).toHaveURL('/');
	});

	test('keyboard shortcut Ctrl+, navigates to /settings', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Control+Comma');
		await expect(page).toHaveURL(/\/settings/);
	});

	test('keyboard shortcut Ctrl+\\ toggles sidebar', async ({ page }) => {
		await page.goto('/');
		// Get initial sidebar state
		const sidebar = page.getByRole('navigation'); // adapt to actual selector
		const initialExpanded = await sidebar.getAttribute('data-collapsed');

		await page.keyboard.press('Control+Backslash');
		await expect(sidebar).not.toHaveAttribute('data-collapsed', initialExpanded ?? 'false');
	});
});

test.describe('Route fallback', () => {
	test('unknown route shows fallback or redirects', async ({ page }) => {
		await page.goto('/this-does-not-exist');
		// Should either show a 404 page or redirect to /
		const url = page.url();
		expect(url).toMatch(/localhost:4173\/(this-does-not-exist)?/);
		// Verify no JS crash
	});
});
```

---

## Suite 2 — URL State & Browser History (Sub-agent 2)

**File**: `tests/e2e/url-state.spec.ts`
**Purpose**: Verify URL query params serialize state correctly and browser back/forward restore it
**Priority**: 🔴 Critical (URL state is a non-obvious feature with many edge cases)

```ts
test.describe('Board URL state — issue + tab selection', () => {
	test('selecting an issue updates the URL', async ({ page }) => {
		await page.goto('/');
		// IssueCard has NO data-issue-id attribute — selection is context-driven.
		// Find cards by their CSS class. Read IssueCard.svelte to confirm the class name
		// (look for 'card-ic-interactive' or similar on the root div).
		const issueCard = page.locator('.card-ic-interactive').first();
		await issueCard.click();

		// URL should now contain ?issue=<some-id>
		await expect(page).toHaveURL(/[?&]issue=/);
	});

	test('tab switching updates URL tab param', async ({ page }) => {
		await page.goto('/');
		// Click an issue first to activate the bottom panel
		await page.locator('.card-ic-interactive').first().click();

		// Click the Dependencies tab
		await page.getByRole('tab', { name: /dependencies/i }).click();
		await expect(page).toHaveURL(/tab=dependencies/);
	});

	test('direct URL load restores issue + tab state', async ({ page }) => {
		// Navigate directly to URL with issue and tab params
		// Use a known mock issue ID from tauri_mock_data.ts
		// Real mock IDs are semantic strings like 'mock-issue-auth', 'mock-issue-dark-mode',
		// 'mock-issue-perf' etc. Read tauri_mock_data.ts for the actual list.
		await page.goto('/?issue=mock-issue-auth&tab=issue-detail');

		// Issue detail panel should be visible
		await expect(page.getByRole('region', { name: /issue detail/i })).toBeVisible();
		// Or check for the issue title visible in the panel
	});

	test('browser back button reverts issue selection', async ({ page }) => {
		await page.goto('/');

		await page.locator('.card-ic-interactive').first().click();
		const urlWithIssue = page.url();

		await page.goBack();
		await expect(page.url()).not.toContain('issue=');
		// Issue detail panel should be gone
	});

	test('browser forward restores issue selection', async ({ page }) => {
		await page.goto('/');
		await page.locator('.card-ic-interactive').first().click();
		const urlWithIssue = page.url();

		await page.goBack();
		await page.goForward();
		await expect(page).toHaveURL(urlWithIssue);
	});

	test('navigating to settings and back restores board state', async ({ page }) => {
		await page.goto('/');
		await page.locator('.card-ic-interactive').first().click();
		const boardUrlWithIssue = page.url();

		await page.keyboard.press('Control+Comma'); // go to settings
		await expect(page).toHaveURL(/settings/);

		await page.goBack();
		await expect(page).toHaveURL(boardUrlWithIssue);
		// Issue still selected in UI
	});
});

test.describe('Usage URL state', () => {
	test('changing period updates URL', async ({ page }) => {
		await page.goto('/usage');
		await page.getByRole('button', { name: /90 days/i }).click();
		await expect(page).toHaveURL(/period=90d/);
	});

	test('direct URL load /usage?period=90d&scope=dashboard restores filters', async ({ page }) => {
		await page.goto('/usage?period=90d&scope=dashboard');
		// Verify the period and scope controls reflect the URL params
		await expect(page.getByRole('button', { name: /90 days/i })).toHaveAttribute(
			'data-active',
			'true',
		);
		// Adapt selectors to actual implementation
	});

	test('browser back reverts usage filter', async ({ page }) => {
		await page.goto('/usage');
		await page.getByRole('button', { name: /90 days/i }).click();
		await page.goBack();
		await expect(page).not.toHaveURL(/period=90d/);
	});
});

test.describe('Settings character creator params', () => {
	test('edit pack link includes packId query param', async ({ page }) => {
		await page.goto('/settings');
		// Click edit on a character pack (use mock data)
		const editButton = page.getByRole('link', { name: /character creator/i }).first();
		await editButton.click();
		await expect(page).toHaveURL(/character-creator\?packId=/);
	});

	test('cancel in character creator returns to /settings', async ({ page }) => {
		await page.goto('/settings/character-creator?packId=mock-pack-1');
		await page.getByRole('button', { name: /cancel/i }).click();
		await expect(page).toHaveURL(/\/settings$/);
	});
});
```

---

## Suite 3 — Keyboard Shortcuts (Sub-agent 3)

**File**: `tests/e2e/keyboard-shortcuts.spec.ts`
**Purpose**: Verify global keyboard shortcuts work and are properly scoped
**Priority**: 🟠 High

```ts
test.describe('Global keyboard shortcuts', () => {
	test('Ctrl+K opens command palette', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Control+k');

		// Command palette should be visible
		const palette = page.getByRole('dialog'); // or combobox — check actual role
		await expect(palette).toBeVisible();
		await expect(page.getByPlaceholder(/search/i)).toBeFocused();
	});

	test('Ctrl+K closes command palette when open', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).toBeVisible();

		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).not.toBeVisible();
	});

	test('Escape closes command palette', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeVisible();
		// Page should still be on same route
		await expect(page).toHaveURL('/');
	});

	test('command palette ArrowDown + Enter navigates', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Control+k');

		// Type to get a settings result
		await page.keyboard.type('settings');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');

		// Should have navigated to settings
		await expect(page).toHaveURL(/settings/);
	});

	test('Ctrl+, navigates to settings from any page', async ({ page }) => {
		for (const route of ['/', '/sessions', '/usage']) {
			await page.goto(route);
			await page.keyboard.press('Control+Comma');
			await expect(page).toHaveURL(/settings/);
		}
	});

	test('Ctrl+Shift+Q opens quick ideas modal', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Control+Shift+Q');
		await expect(page.getByRole('dialog', { name: /quick ideas/i })).toBeVisible();
	});

	test('Ctrl+Shift+Q works even when a textarea is focused', async ({ page }) => {
		await page.goto('/');
		// Focus a textarea first (find one in the page — creation wizard or notes)
		// Then press Ctrl+Shift+Q — should still work (allowFromEditable: true)
		// This test may need to be adapted based on where textarea elements are accessible
	});
});

test.describe('Shortcut scoping — no bleed', () => {
	test('Ctrl+, inside input field does NOT navigate to settings', async ({ page }) => {
		await page.goto('/settings'); // settings page has inputs
		const input = page.getByRole('textbox').first();
		await input.focus();
		await input.type('test');

		// Press Ctrl+, while input is focused
		await page.keyboard.press('Control+Comma');

		// Should NOT have re-navigated (already on settings, but also should not trigger shortcut)
		// Verify by checking the input still has focus
		await expect(input).toBeFocused();
		// And the value should now contain ',test' if propagation happened, or just 'test' if blocked
		await expect(input).toHaveValue('test'); // not 'test,' — shortcut was blocked
	});

	test('⚠️ Escape in context menu does not affect page navigation', async ({ page }) => {
		// Right-click on the card BODY (not a nested button) to open the card's context menu
		// IssueCard has no data-issue-id attribute — use .card-ic-interactive
		await page.goto('/');
		const card = page.locator('.card-ic-interactive').first();
		await card.click({ button: 'right' });
		const contextMenu = page.getByRole('menu');
		await expect(contextMenu).toBeVisible();

		// Press Escape
		await page.keyboard.press('Escape');

		// Context menu should close
		await expect(contextMenu).not.toBeVisible();

		// Page should STILL be on '/' — Escape did NOT trigger sidebar-collapse or other action
		await expect(page).toHaveURL('/');

		// Issue selection state should be unchanged (Escape only closed the menu)
	});

	test('⚠️ Right-click on quick-action button does NOT open the card context menu', async ({
		page,
	}) => {
		// Quick-action buttons (folder/terminal/editor) call stopPropagation on the contextmenu
		// event, so right-clicking them fires their own action instead of the card context menu.
		// bits-ui ContextMenu.Trigger listens to the native "contextmenu" DOM event (not a click
		// with button:2). Stopping contextmenu propagation from a nested element blocks it.
		await page.goto('/');
		const card = page.locator('.card-ic-interactive').first();

		// Find a quick-action button inside the card — these are icon buttons visible on hover.
		// Read IssueCard.svelte to confirm the exact role/label.
		const quickActionButton = card
			.getByRole('button', { name: /folder|terminal|editor/i })
			.first();
		await quickActionButton.click({ button: 'right' });

		// Card's context menu must NOT have opened (the button's own handler handled the event)
		await expect(page.getByRole('menu')).not.toBeVisible();
	});

	test('Right-click on card body (not a button) DOES open the card context menu', async ({
		page,
	}) => {
		// This verifies the positive case: right-clicking the card itself works as expected.
		// Priority chip, GitHub links, and other non-action nested elements do NOT suppress
		// contextmenu — right-clicking them opens the card's context menu, which is correct UX.
		await page.goto('/');
		const card = page.locator('.card-ic-interactive').first();

		// Click the card body area (not a nested button) to open the card's context menu
		await card.click({ button: 'right', position: { x: 10, y: 10 } });
		await expect(page.getByRole('menu')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('menu')).not.toBeVisible();
	});
});

test.describe('Focus management', () => {
	test('Tab focus stays inside open dialog', async ({ page }) => {
		await page.goto('/');

		// Open a dialog (command palette or any modal)
		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).toBeVisible();

		// Press Tab multiple times (10x) and verify focus never leaves the dialog
		for (let i = 0; i < 10; i++) {
			await page.keyboard.press('Tab');
			const focused = await page.evaluate(() => {
				const el = document.activeElement;
				// Check if focused element is inside the dialog
				const dialog = document.querySelector('[role="dialog"]');
				return dialog?.contains(el) ?? false;
			});
			expect(focused).toBe(true);
		}
	});

	test('closing dialog returns focus to trigger element', async ({ page }) => {
		await page.goto('/');

		// Focus the Ctrl+K trigger area first — press the shortcut
		await page.keyboard.press('Control+k');
		await page.keyboard.press('Escape');

		// Focus should return to a sensible element (document body or the trigger)
		const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
		expect(['BODY', 'BUTTON', 'A']).toContain(focusedTag);
	});
});
```

---

## Suite 4 — Issue Creation Workflow (Sub-agent 4)

**File**: `tests/e2e/issue-creation.spec.ts`
**Purpose**: Verify the issue creation wizard workflow end-to-end
**Priority**: 🟠 High
**Note**: In browser mock mode, `invoke('create_issue')` returns a mock response. The new issue will appear in mock state but won't persist across page reloads.

```ts
test.describe('Issue creation wizard', () => {
	test('wizard opens via button', async ({ page }) => {
		await page.goto('/');
		// There are two entry points:
		// 1. Toolbar "New Issue" button (main board toolbar)
		// 2. Empty state "+ Add Issue" button (shown when no issues exist)
		// There is NO keyboard shortcut to open the creation wizard.
		const createButton = page.getByRole('button', {
			name: /new issue|create issue|add issue/i,
		});
		await createButton.first().click();

		await expect(page.getByRole('dialog', { name: /new issue|create issue/i })).toBeVisible();
	});

	test('wizard step 1 (GitHub search): search filters results', async ({ page }) => {
		await page.goto('/');
		const createButton = page.getByRole('button', {
			name: /new issue|create issue|add issue/i,
		});
		await createButton.first().click();

		// Step 1: GitHub search
		const searchInput = page.getByPlaceholder(/search/i);
		await searchInput.fill('auth');

		// Wait for debounce + results
		await page.waitForTimeout(400);

		// Results should be filtered (mock returns issues matching 'auth')
		const results = page.getByRole('option');
		await expect(results.first()).toBeVisible();
	});

	test('wizard advances from step 1 to step 2 on Enter', async ({ page }) => {
		await page.goto('/');
		await page
			.getByRole('button', { name: /new issue|create issue|add issue/i })
			.first()
			.click();

		// Press Enter on step 1 (skip GitHub search)
		await page.keyboard.press('Enter');

		// Should now be on step 2 (Issue Name input)
		await expect(page.getByPlaceholder(/issue name|title/i)).toBeFocused();
	});

	test('wizard step 2: name validation — empty name cannot advance', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /new issue/i }).click();
		await page.keyboard.press('Enter'); // skip step 1

		// Clear name input and try to submit
		const nameInput = page.getByPlaceholder(/issue name|title/i);
		await nameInput.clear();
		await page.keyboard.press('Enter');

		// Should still be on step 2 — validation error shown
		await expect(nameInput).toBeFocused();
		// OR: error message visible
	});

	test('wizard completes and issue appears (mock)', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /new issue/i }).click();

		// Step 1: skip
		await page.keyboard.press('Enter');

		// Step 2: enter name
		await page.getByPlaceholder(/issue name|title/i).fill('My Test Issue E2E');
		await page.keyboard.press('Enter');

		// Step 3+ (color, worktree): skip with Enter
		await page.keyboard.press('Enter');

		// Dialog should close
		await expect(page.getByRole('dialog', { name: /new issue/i })).not.toBeVisible();

		// In mock mode, the created issue may appear in the list (mock state)
		// At minimum, no error dialog should appear
	});

	test('⚠️ Escape in wizard step closes only wizard, not page', async ({ page }) => {
		await page.goto('/');
		await page
			.getByRole('button', { name: /new issue|create issue|add issue/i })
			.first()
			.click();
		await expect(page.getByRole('dialog')).toBeVisible();

		await page.keyboard.press('Escape');

		// Wizard closes
		await expect(page.getByRole('dialog')).not.toBeVisible();

		// Page navigation unchanged — still on '/'
		await expect(page).toHaveURL('/');

		// No other side effects (sidebar not closed, etc.)
	});

	test('⚠️ Escape in step 2 (text input focused) navigates back to step 1, not close wizard', async ({
		page,
	}) => {
		await page.goto('/');
		await page
			.getByRole('button', { name: /new issue|create issue|add issue/i })
			.first()
			.click();
		await page.keyboard.press('Enter'); // go to step 2

		// Step 2 has a text input; when a text input is focused, Escape goes BACK to step 1
		// (not close the wizard). If no text input is focused at that moment, Escape closes
		// the wizard entirely. This test covers the "input focused" path.
		const nameInput = page.getByPlaceholder(/issue name|title/i);
		await nameInput.focus();
		await page.keyboard.press('Escape');

		// Wizard should be back on step 1, NOT closed entirely.
		// Adapt the step indicator selector to the actual implementation.
	});
});
```

---

## Instructions for Each Sub-Agent

```
You are implementing a Playwright E2E test suite for Grovekeeper (Tauri + SvelteKit app in browser mock mode).

1. Read playwright.config.ts completely.
2. Update playwright.config.ts if needed (add baseURL, reuseExistingServer, etc.) before writing tests.
3. Create the test file in tests/e2e/ with the name specified.
4. Write tests using @playwright/test (import { test, expect } from '@playwright/test').
5. Use semantic selectors: getByRole(), getByLabel(), getByText(), getByPlaceholder().
   Avoid CSS selectors except when semantic ones are not available.
6. For selectors that depend on data attributes (like data-issue-id), read the component source first
   to confirm the attribute name is correct. Do NOT guess attribute names.
7. For each test:
   a. Note what mock data is available (from tauri_mock_data.ts)
   b. Use known mock IDs/names as anchors for assertions
   c. Tests must not depend on order or timing of unrelated async operations
8. ⚠️ Event propagation tests are REQUIRED for:
   - Every overlay (dropdown, context menu, popover) that can be opened
   - The issue creation wizard Escape behavior
9. When a test fails because of a bug in the app:
   a. Reproduce the bug manually if possible (pnpm dev or pnpm preview)
   b. Identify the root cause
   c. Fix it (usually in event handling — see CONVENTIONS.md §1)
   d. Verify test passes
   e. Document in Findings Report
10. Run: pnpm test:e2e after writing tests. Fix all failures before completing.
11. Return a Findings Report (format in CONVENTIONS.md §4).
```

---

## Completion Criteria

- All 4 spec files exist and pass
- `pnpm test:e2e` passes with no failures
- `--pass-with-no-tests` flag may be removed from the `test:e2e` script in package.json (now we have tests)
- Consolidated Findings Report produced

## Selector Strategy Reference

| Element type     | Preferred selector                                                         |
| ---------------- | -------------------------------------------------------------------------- |
| Navigation links | `page.getByRole('link', { name: /text/i })`                                |
| Buttons          | `page.getByRole('button', { name: /text/i })`                              |
| Inputs           | `page.getByPlaceholder(...)` or `page.getByRole('textbox', { name: ... })` |
| Tabs             | `page.getByRole('tab', { name: /text/i })`                                 |
| Dialogs/modals   | `page.getByRole('dialog')`                                                 |
| Headings         | `page.getByRole('heading', { name: /text/i })`                             |
| Issue cards      | `page.locator('[data-issue-id]')` (confirm attr name in source)            |
| Context menus    | `page.getByRole('menu')`                                                   |

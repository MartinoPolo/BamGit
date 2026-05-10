---
name: gk-svelte-effect-audit
description: 'Audit all $effect rune usages against Svelte 5 best practices, categorize by severity/confidence, and auto-fix. Use when: "audit effects", "check effects", "effect audit", "effect review", "effect anti-patterns", "svelte effect audit"'
allowed-tools: Grep, Read, Edit, Bash(pnpm check:fast)
metadata:
    author: MartinoPolo
    version: '0.1'
    category: execution
---

# Svelte $effect Rune Audit

Scan all files for `$effect` usage, flag anti-patterns, auto-fix where confident.

## Anti-Pattern Catalog

Six patterns, ordered by severity. [Full catalog with examples and fix templates](REFERENCE.md)

| ID  | Pattern                                                                         | Severity | Typical Confidence |
| --- | ------------------------------------------------------------------------------- | -------- | ------------------ |
| E1  | **circular-sync** — effects updating each other's dependencies                  | error    | high               |
| E2  | **derived-via-effect** — `$effect` setting state that should be `$derived`      | error    | high               |
| E3  | **state-update-in-effect** — assigning `$state` inside `$effect` beyond E2      | error    | medium             |
| W1  | **missing-cleanup** — intervals/listeners/subscriptions without teardown return | warning  | medium             |
| W2  | **browser-guard** — `if (browser)` inside `$effect` (effects skip SSR already)  | warning  | high               |
| W3  | **logging-without-inspect** — `console.log` in `$effect` instead of `$inspect`  | warning  | high               |

### Confidence Levels

- **high** — pattern is unambiguous, auto-fix is safe
- **medium** — pattern is likely wrong but context may justify it; auto-fix with confirmation
- **low** — suspicious but plausibly intentional; report only, no auto-fix

## Process

### Step 1: Find All Effects

```
Grep for `\$effect` in all `.svelte`, `.svelte.ts`, and `.ts` files under `src/`.
```

Record each match as `file:line`. If zero matches, report "No $effect usages found" and stop.

### Step 2: Analyze Each Effect

For each file containing `$effect`:

1. Read the file
2. Identify every `$effect` block (including `$effect.pre`, `$effect.root`)
3. For each block, check against all 6 anti-patterns (see [REFERENCE.md](REFERENCE.md) for detection heuristics)
4. Record: `file:line`, pattern ID, severity, confidence, brief description

### Step 3: Report Findings

Present a summary table grouped by severity, then confidence:

```
## Findings

### Errors (N)
| File:Line | Pattern | Confidence | Description |
|-----------|---------|------------|-------------|
| ...       | ...     | ...        | ...         |

### Warnings (N)
| File:Line | Pattern | Confidence | Description |
|-----------|---------|------------|-------------|
| ...       | ...     | ...        | ...         |

### Clean Effects (N)
<list of file:line that passed all checks>
```

If no findings, report "All $effect usages follow best practices."

### Step 4: Auto-Fix

For each finding:

- **high confidence**: apply the fix directly using Edit
- **medium confidence**: present the proposed fix inline and ask user to confirm before applying
- **low confidence**: report only, suggest the fix but take no action

Fix templates per pattern are in [REFERENCE.md](REFERENCE.md).

### Step 5: Validate Fixes

After all fixes are applied:

1. Run `pnpm check:fast` to verify formatting and linting pass
2. Use the `mcp__svelte__svelte-autofixer` tool on each modified `.svelte` file
3. Report any issues from either check and iterate until clean

### Step 6: Summary

```
## Audit Summary
- Files scanned: N
- Effects found: N
- Errors fixed: N (auto: N, confirmed: N)
- Warnings fixed: N (auto: N, confirmed: N)
- Report-only: N
- Clean effects: N
```

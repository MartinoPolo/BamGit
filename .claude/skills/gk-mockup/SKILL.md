---
name: gk-mockup
description: 'Generate HTML variant mockups from a Grovekeeper design brief. Default: 1 mockup. Pass a number for multiple variants (e.g., gk-mockup 3). Use when: "create mockup", "design variant", "mock up", "visualize design", "mockup", "three variants"'
argument-hint: "[count] [brief-path or 'all']"
allowed-tools: Read, Write, Glob, Grep, Bash(mkdir *), Agent
metadata:
    author: MartinoPolo
    version: '0.2'
    category: design
---

# Design Mockup Generation

Generate self-contained HTML mockup(s) from a design brief, using the Grovekeeper design system.

**Default**: 1 mockup. Pass a number as first argument for multiple variants (e.g., `gk-mockup 3`).

## Available UI Components

!`ls src/lib/components/ui/ 2>/dev/null | sort`

## Current State

!`echo "=== Briefs ===" && ls claude_design/design_briefs/ 2>/dev/null && echo "=== Existing Mockups ===" && for d in claude_design/mockups/*/; do echo "$(basename "$d"): $(ls "$d"variant-*.html 2>/dev/null | wc -l) variants, refined=$(ls "$d"refined.html 2>/dev/null | wc -l)"; done 2>/dev/null`

## Argument Parsing

Parse the argument string:

- If first token is a number N (1-5): generate N variants. Remaining tokens = brief path.
- If first token is NOT a number: generate 1 variant. Entire argument = brief path.
- If no arguments: generate 1 variant for the next unprocessed brief.

Examples:

- `gk-mockup` → 1 variant, auto-detect next brief
- `gk-mockup 3` → 3 variants, auto-detect next brief
- `gk-mockup 3 ASSIGNED_ISSUES_PANEL` → 3 variants for that brief
- `gk-mockup ASSIGNED_ISSUES_PANEL` → 1 variant for that brief
- `gk-mockup all` → 1 variant per unprocessed brief
- `gk-mockup 3 all` → 3 variants per unprocessed brief

## Process

### Step 1: Read Design System

Read `claude_design/DESIGN_SYSTEM.md` for the complete design system reference — available `gk-*` / `cb-*` classes, component patterns, and spacing conventions.

Do **not** read `claude_design/tokens.css`. Mockups reference it via a stylesheet link (`../../tokens.css`); the file is never inlined.

### Step 2: Identify Target Briefs

- If argument is a file path: use that single brief.
- If argument is `all` or omitted: find all briefs in `claude_design/design_briefs/` **without** a leading underscore that don't already have a matching directory with variants in `claude_design/mockups/<brief-name-lowercase>/`.
    - Brief-to-directory mapping: `SOME_BRIEF_NAME.md` → `claude_design/mockups/some-brief-name/` (lowercase, underscores to hyphens, no extension).

### Step 3: Discover Reusable Components

Scan Storybook stories to identify available components:

```
ls src/lib/components/**/*.stories.svelte
```

For components needed by the brief but missing from the library: spawn `mp-context7-docs-fetcher` agent to look up shadcn-svelte (`/huntabyte/shadcn-svelte`) and Bits UI (`/huntabyte/bits-ui`). Can install with `pnpm dlx shadcn-svelte@latest add <name> --yes --overwrite` if needed for reference, but Storybook story creation is deferred to the refine phase.

### Step 4: Generate Mockup(s)

Create the output directory:

```
mkdir -p claude_design/mockups/<brief-name>
```

**If N = 1** (default): Generate a single mockup directly. Pick the most promising variant direction from the brief. Output file: `claude_design/mockups/<brief-name>/variant-a.html`

**If N > 1**: Spawn N `mp-ui-variant-generator` agents in parallel — one per variant direction (A, B, C, ... as specified in the brief). Output files: `claude_design/mockups/<brief-name>/variant-{a,b,c,...}.html`

Each agent receives:

- The full design brief content
- The design system class reference extracted from `claude_design/DESIGN_SYSTEM.md` (class names + usage notes, **not** raw CSS values)
- The variant direction and structural approach
- List of available components to reference
- The **Container Context** rules from the brief (critical — see below)
- Instruction to produce an HTML file with:
    - `<link rel="stylesheet" href="../../tokens.css">` in `<head>` — do **not** inline CSS tokens
    - Geist / Geist Mono loaded from Google Fonts CDN (with system fallbacks)
    - Root element: `<div class="gk-root theme-dark">`
    - Design system classes (`gk-*`, `cb-*`) used throughout
    - Only component-specific CSS in `<style>` (layout, component-unique styles; never design token values)
    - Realistic mock data (real file paths, plausible metrics, believable content)
    - Variant label at top using `.gk-eyebrow` styling (e.g., "VARIANT A: DENSE, DEVELOPER-FOCUSED")
    - All required elements from the brief included

#### Container Context Rules (Critical)

If the brief has a **Container Context** section, the mockup must respect it:

- **Show the parent container** (e.g., bottom panel with tab bar) as read-only context so the viewer sees where this component lives
- The parent container elements (tab bar, panel chrome, borders) are **non-editable context** — styled with reduced opacity or a subtle visual distinction to separate "context" from "designed content"
- The **designed component fills only its designated area** within the parent — no extra headers, footers, borders, or wrappers that duplicate the parent's chrome
- If the component is a tab content area, show the tab bar with the correct tab active, but do NOT style the tab bar as part of the component's design — it belongs to the parent

### Step 5: Open in Browser

Use Chrome DevTools MCP to open each variant as a new page (`file:///` URL with absolute path). Leave all tabs open for the user to browse and compare.

If Chrome DevTools MCP is unavailable, provide file paths for manual browser viewing.

### Step 6: Report

List the variant(s) with brief descriptions of each approach and file paths.

If multiple variants were generated, mention that `/gk-design-refine <variant-letter> <refinement requirements...>` can be used next to apply refinements to the chosen variant, producing `refined.html`, `SUMMARY.md`, and an updated brief.

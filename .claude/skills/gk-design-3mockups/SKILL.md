---
name: gk-design-3mockups
description: 'Generate three HTML variant mockups from a Grovekeeper design brief. Use when: "create mockups", "design variants", "mock up", "visualize design", "three variants", "three mockups"'
argument-hint: "[brief-path or 'all']"
allowed-tools: Read, Write, Glob, Grep, Bash(mkdir *), Agent
metadata:
    author: MartinoPolo
    version: '0.1'
    category: design
---

# Design Mockup Generation — Three Variants

Generate three distinct self-contained HTML variant mockups from a design brief, using the Grovekeeper design system.

## Available UI Components

!`ls src/lib/components/ui/ 2>/dev/null | sort`

## Current State

!`echo "=== Briefs ===" && ls claude_design/design_briefs/ 2>/dev/null && echo "=== Existing Mockups ===" && for d in claude_design/mockups/*/; do echo "$(basename "$d"): $(ls "$d"variant-*.html 2>/dev/null | wc -l) variants"; done 2>/dev/null`

## Process

### Step 1: Read Design System

Read `claude_design/DESIGN_SYSTEM.md` for the complete design system reference.
Read `claude_design/tokens.css` for all CSS token definitions — this gets inlined into every mockup.

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

### Step 4: Generate Three Variants

Create the output directory:

```
mkdir -p claude_design/mockups/<brief-name>
```

Spawn three `mp-ui-variant-generator` agents in parallel — one per variant direction (A, B, C as specified in the brief).

Each agent receives:

- The full design brief content
- The complete `claude_design/tokens.css` content (to inline in `<style>`)
- The variant direction and structural approach
- List of available components to reference
- Instruction to produce a **self-contained HTML file** with:
    - All tokens.css inlined in `<style>`, plus any component-specific CSS
    - Root element: `<div class="gk-root theme-dark">`
    - Geist / Geist Mono loaded from Google Fonts CDN (with system fallbacks)
    - Design system classes (`gk-*`, `cb-*`) used throughout
    - Realistic mock data (real file paths, plausible metrics, believable content)
    - Variant label at top using `.gk-eyebrow` styling (e.g., "VARIANT A: DENSE, DEVELOPER-FOCUSED")
    - All required elements from the brief included

Output files: `claude_design/mockups/<brief-name>/variant-{a,b,c}.html`

### Step 5: Open in Browser

Use Chrome DevTools MCP to open each variant as a new page (`file:///` URL with absolute path). Leave all three tabs open for the user to browse and compare.

If Chrome DevTools MCP is unavailable, provide file paths for manual browser viewing.

### Step 6: Report

List the three variants with brief descriptions of each approach and file paths.

Mention that `/gk-design-refine` can be used next to create the final mockup from the chosen variant.

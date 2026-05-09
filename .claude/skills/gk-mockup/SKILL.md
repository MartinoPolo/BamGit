---
name: gk-mockup
description: 'Generate HTML variant mockups from a Grovekeeper design brief. Default: 1 mockup. Pass a number for multiple variants (e.g., gk-mockup 3). Use when: "create mockup", "design variant", "mock up", "visualize design", "mockup", "three variants"'
argument-hint: "[count] [component-name or 'all']"
allowed-tools: Read, Write, Glob, Grep, Bash(mkdir *), Agent
metadata:
    author: MartinoPolo
    version: '0.3'
    category: design
---

# Design Mockup Generation

Generate self-contained HTML mockup(s) from a design brief, using the Grovekeeper design system.

**Default**: 1 mockup. Pass a number as first argument for multiple variants (e.g., `gk-mockup 3`).

## Available UI Components

!`ls src/lib/components/ui/ 2>/dev/null | sort`

## Current State

!`echo "=== Component Designs ===" && for d in designs/*/; do name=$(basename "$d"); brief=$(ls "$d"DESIGN_BRIEF_*.md 2>/dev/null | wc -l); variants=$(ls "$d"variants/variant-*.html 2>/dev/null | wc -l); refined=$(ls "$d"refined.html 2>/dev/null | wc -l); echo "$name: brief=$brief variants=$variants refined=$refined"; done 2>/dev/null`

## Argument Parsing

- First token is a number N (1–5): generate N variants. Remaining tokens = component name.
- First token is NOT a number: generate 1 variant. Entire argument = component name.
- No arguments: generate 1 variant for the next brief with no variants yet.
- `all` / `N all`: generate variants for every component with a brief but no variants.

Examples:
- `gk-mockup` → 1 variant, auto-detect next
- `gk-mockup 3` → 3 variants, auto-detect next
- `gk-mockup assigned-issues-panel` → 1 variant for that component
- `gk-mockup 3 assigned-issues-panel` → 3 variants for that component

## Process

### Step 1: Read Design System

Read `designs/DESIGN_SYSTEM.md` — available `gk-*` / `cb-*` classes, component patterns, spacing.

Do **not** read or inline `designs/tokens.css`. Mockups reference it via stylesheet link.

### Step 2: Identify Target Brief

- Named component: read `designs/<component-name>/DESIGN_BRIEF_<COMPONENT_NAME>.md`
- Auto-detect: find a component folder under `designs/` that has a brief but no `variants/variant-*.html`

### Step 3: Discover Reusable Components

Scan stories: `ls src/lib/components/**/*.stories.svelte`

For missing patterns, spawn `mp-context7-docs-fetcher` to check shadcn-svelte (`/huntabyte/shadcn-svelte`) and Bits UI (`/huntabyte/bits-ui`). Defer actual installation to the refine phase.

### Step 4: Generate Mockup(s)

Output directory: `designs/<component-name>/variants/`

**N = 1**: Generate a single mockup. Output: `designs/<component-name>/variants/variant-a.html`

**N > 1**: Spawn N `mp-ui-variant-generator` agents in parallel. Output: `designs/<component-name>/variants/variant-{a,b,c,...}.html`

Each mockup must:
- `<link rel="stylesheet" href="../../tokens.css">` in `<head>` — never inline tokens
- Geist / Geist Mono from Google Fonts CDN (with system fallbacks)
- Root element: `<div class="gk-root theme-dark">`
- Design system classes (`gk-*`, `cb-*`) throughout
- Only component-specific CSS in `<style>` (layout, unique styles; never token values)
- Realistic mock data (real file paths, plausible metrics, believable content)
- Variant label at top using `.gk-eyebrow` (e.g., "VARIANT A: DENSE, DEVELOPER-FOCUSED")
- All required elements from the brief

#### Container Context (Critical)

If the brief specifies a **Container Context**:
- Show the parent container (tab bar, panel chrome) at reduced opacity as non-editable context
- The designed component fills only its designated area — no duplicate headers, borders, or footers
- Standalone components own their full chrome

### Step 5: Open in Browser

Open each variant via `file:///` URL. Leave tabs open for comparison.

### Step 6: Report

List variants with brief descriptions and file paths. Mention that `/gk-design-refine <variant-letter> <requirements>` can be used next to produce `refined.html` and `SUMMARY.md`.

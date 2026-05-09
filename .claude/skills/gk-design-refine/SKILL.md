---
name: gk-design-refine
description: 'Apply refinement requirements to a chosen variant, produce refined.html + SUMMARY.md, update brief, link to GitHub issue. Use when: "refine design", "accept variant", "polish design", "select variant", "apply refinements", "refine variant B"'
argument-hint: '<variant-letter> [refinement requirements...]'
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mkdir *), Bash(pnpm dlx shadcn-svelte*), Bash(gh *), Agent
metadata:
    author: MartinoPolo
    version: '0.4'
    category: design
---

# Design Refinement

Apply refinement requirements to a chosen variant. Produces `refined.html` and `SUMMARY.md`, updates the design brief, and links to the GitHub issue.

## Process

### Step 1: Parse Arguments

- **Variant**: first token — letter (A–Z) identifying the variant (case-insensitive)
- **Refinements**: everything after the variant — requirements to apply

Example: `B make header sticky, use Badge for status, add empty state`
→ Variant B + 3 refinements

Ask if the variant is missing. Ask what to change if refinements are empty.

### Step 2: Locate Source Files

1. Infer active component from context, or find the most recently modified folder under `designs/` that has variants.
2. Read: `designs/<component-name>/variants/variant-<letter>.html` (chosen variant)
3. Read: `designs/<component-name>/DESIGN_BRIEF_<COMPONENT_NAME>.md` (full brief)
4. Read: `designs/DESIGN_SYSTEM.md` (class names and component reference)

### Step 3: Inventory Available Components

For every component referenced in the brief or refinements:

- Check `src/lib/components/ui/` for existence
- Read the `.stories.svelte` to identify available props/variants
- Note gaps

### Step 4: Adopt Missing Components (if needed, preferably from shadcn-svelte or Bits UI)

1. Spawn `mp-context7-docs-fetcher` to look up in shadcn-svelte (`/huntabyte/shadcn-svelte`) or Bits UI (`/huntabyte/bits-ui`)
2. Install: `pnpm dlx shadcn-svelte@latest add <name> --yes --overwrite`
3. Record adoption in SUMMARY.md

### Step 5: Produce `refined.html`

Create `designs/<component-name>/refined.html`.

The refined HTML must:

- Use the chosen variant as visual and structural base
- Apply **every** refinement requirement
- Cover all states from the brief (not just the happy path)
- `<link rel="stylesheet" href="../tokens.css">` in `<head>` — **never** inline token values
- Geist / Geist Mono from Google Fonts CDN (with system fallbacks)
- Design system classes (`gk-*`, `cb-*`) throughout
- Only component-specific styles in `<style>`
- Realistic mock data
- Header label: `REFINED — Variant <X> + <short refinement summary>` using `.gk-eyebrow`
- Respect Container Context from the brief — show parent chrome at reduced opacity

### Step 6: Create `SUMMARY.md`

Create `designs/<component-name>/SUMMARY.md`.

The summary must **not** duplicate content from the design brief. All design requirements, states, and layout rules live in the brief. The summary captures the implementation-relevant decisions and component map.

```markdown
# <Component Name> — Design Summary

**Base**: Variant <X> | **Refined**: <date>

## Refinements Applied

Variant <X> was chosen and refined with: [comma-separated list]. See the design brief for full
requirements. Key changes from the base variant: [1–3 concise sentences on structural differences].

## Component Map

### Codebase — Use As-Is

| Component | Path                            | Usage         | Key Props/Variants          |
| --------- | ------------------------------- | ------------- | --------------------------- |
| Button    | `src/lib/components/ui/button/` | [where + how] | `variant="ghost" size="sm"` |
| Badge     | `src/lib/components/ui/badge/`  | [where + how] | `variant="success"`         |

### Adopt from shadcn-svelte / Bits UI

| Component | Source        | Install command                            | Purpose          |
| --------- | ------------- | ------------------------------------------ | ---------------- |
| [name]    | shadcn-svelte | `pnpm dlx shadcn-svelte@latest add [name]` | [what it covers] |

### Build Custom

| Proposed Name | Description    | Why existing components don't cover it |
| ------------- | -------------- | -------------------------------------- |
| [name]        | [what it does] | [reason]                               |

## Implementation Notes

[Animation approach, event model, accessibility, keyboard nav, scroll behavior, edge cases to
handle in Svelte. Only things not already in the brief.]
```

### Step 7: Update Design Brief

Prepend a refinement block below the `# Title` heading:

```markdown
> **Status**: Refined (Variant <X>)
> **Refined mockup**: `designs/<component-name>/refined.html`
> **Summary**: `designs/<component-name>/SUMMARY.md`
> **Refinements**: [comma-separated short list]
```

If the refinement process revealed missing requirements or corrections, add/update them in the brief's relevant sections rather than documenting them separately in the summary.

### Step 8: Link to GitHub Issue

Ask for the associated GitHub issue number if not known.

```bash
gh issue comment <number> --body "## Design Refined

Variant **<X>** refined: [comma-separated refinements]

**Artifacts:**
- \`designs/<component-name>/refined.html\` — open in browser to review
- \`designs/<component-name>/SUMMARY.md\` — component map + implementation notes
- \`designs/<component-name>/DESIGN_BRIEF_<COMPONENT_NAME>.md\` — updated brief"
```

### Step 9: Screenshot & Report

Open `refined.html` in Chrome DevTools MCP and screenshot for the user.

Report: `refined.html` path, `SUMMARY.md` path, components to reuse (count + names), components adopted (if any).

## Folder Layout

```
designs/
└── <component-name>/
    ├── DESIGN_BRIEF_<COMPONENT_NAME>.md   ← authoritative requirements (always updated)
    ├── refined.html                        ← authoritative visual design (post-refine)
    ├── SUMMARY.md                          ← component map + implementation notes
    └── variants/
        ├── variant-a.html                  ← kept for reference
        ├── variant-b.html
        └── VARIANT-*.md                    ← decision notes
```

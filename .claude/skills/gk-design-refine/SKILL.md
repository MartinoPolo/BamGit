---
name: gk-design-refine
description: 'Apply refinement requirements to a chosen variant, produce refined.html + SUMMARY.md, update brief, link to GitHub issue. Use when: "refine design", "accept variant", "polish design", "select variant", "apply refinements", "refine variant B"'
argument-hint: '<variant-letter> [refinement requirements...]'
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mkdir *), Bash(pnpm dlx shadcn-svelte*), Bash(gh *), Agent
metadata:
    author: MartinoPolo
    version: '0.3'
    category: design
---

# Design Refinement

Apply refinement requirements to a chosen variant. Produces `refined.html`, `SUMMARY.md`, and updates the design brief. Links everything to the GitHub issue.

## Process

### Step 1: Parse Arguments

Extract from the argument string:

- **Variant**: the first token — a letter (A–Z) or number identifying the variant to refine (case-insensitive)
- **Refinements**: everything after the variant token — a list of requirements to apply to the design

Example: `B make header sticky, use Badge component for status, add empty state`
→ Variant B + 3 refinement requirements

If the variant is missing, ask before continuing. If refinements are empty, ask what should be changed from the base variant.

### Step 2: Locate Source Files

Find the design brief and chosen variant:

1. If the current working context is a specific brief/component, use that folder.
2. Otherwise, look for the most recently modified mockup folder with variants matching the given letter: `claude_design/mockups/<component-name>/variant-<letter>.html`
3. Find the corresponding brief in `claude_design/design_briefs/` (match folder name to brief name: `some-brief-name/` ↔ `SOME_BRIEF_NAME.md`).

Read:

- The chosen variant HTML file fully
- The full design brief
- `claude_design/DESIGN_SYSTEM.md` for class names and component reference

### Step 3: Inventory Available Components

Scan existing Svelte components:

```
ls src/lib/components/ui/
```

For every component referenced in the brief or the refinement requirements:

- Check if it exists under `src/lib/components/ui/`
- If it exists, read its `.stories.svelte` to identify available props and variants
- Note whether it covers the design need or falls short

### Step 4: Adopt Missing Components (if needed)

If the refinements or design require UI patterns not yet in `src/lib/components/ui/`:

1. Spawn `mp-context7-docs-fetcher` to look up the component in shadcn-svelte (`/huntabyte/shadcn-svelte`) and Bits UI (`/huntabyte/bits-ui`)
2. Install: `pnpm dlx shadcn-svelte@latest add <name> --yes --overwrite`
3. Record the adoption in `SUMMARY.md` (Step 6)

### Step 5: Produce `refined.html`

Create `claude_design/mockups/<component-name>/refined.html`.

The refined HTML must:

- Use the chosen variant as the visual and structural base
- Apply **every** refinement requirement listed in the arguments
- Include **all states and edge cases** from the brief (not just the happy path)
- Use `<link rel="stylesheet" href="../../tokens.css">` in `<head>` — **never** inline CSS token values
- Use Geist / Geist Mono from Google Fonts CDN (with system fallbacks)
- Use design system classes (`gk-*`, `cb-*`) throughout
- Put only component-specific styles in `<style>` (layout, unique shapes; never token variable redefinitions)
- Show realistic mock data
- Have a header label using `.gk-eyebrow` styling: `REFINED — Variant <X> + <short refinement summary>`
- Respect the **Container Context** from the brief — show parent chrome at reduced opacity as context, fill only the designated area

### Step 6: Create `SUMMARY.md`

Create `claude_design/mockups/<component-name>/SUMMARY.md`.

```markdown
# <Component Name> — Design Summary

> Base variant: Variant <X>
> Refined: <date>

## Refinements Applied

- [Each refinement requirement and exactly how it was addressed in the HTML]

## Component Reuse

### Reuse Existing Components

| Component | File                            | Where used | Props / Variants            |
| --------- | ------------------------------- | ---------- | --------------------------- |
| Button    | `src/lib/components/ui/button/` | [describe] | `variant="ghost" size="sm"` |
| Badge     | `src/lib/components/ui/badge/`  | [describe] | `variant="success"`         |
| ...       |                                 |            |                             |

### Components to Adopt

| Component | Source        | Purpose                       |
| --------- | ------------- | ----------------------------- |
| [name]    | shadcn-svelte | [what it replaces or enables] |

### Custom Components Needed

| Proposed Name | Description    | Why not covered by existing |
| ------------- | -------------- | --------------------------- |
| [name]        | [what it does] | [reason]                    |

## Key Design Decisions

- **[Decision area]**: [What was decided and why — captures intent for the implementer]

## States Covered

List every interactive / data state shown in `refined.html`:

- Default
- Hover / Focus / Active
- [all states from the brief]
- Empty state
- Error / failure state
- Loading / skeleton state

## Implementation Notes

[Anything requiring special attention during Svelte implementation: animation approach, event model, accessibility concerns, keyboard nav, scroll behavior, etc.]
```

### Step 7: Update Design Brief

Prepend a refinement block to the design brief (insert below the `# Title` heading, above any existing content):

```markdown
> **Refined mockup**: `claude_design/mockups/<component-name>/refined.html`
> **Design summary**: `claude_design/mockups/<component-name>/SUMMARY.md`
> **Base variant**: Variant <X>
> **Refinements applied**: [comma-separated short list]
```

Do NOT rename or add an underscore prefix to the brief — keep it discoverable for implementation.

### Step 8: Link to GitHub Issue

Ask for the associated GitHub issue number if not already known from context or the brief.

Post a comment:

```bash
gh issue comment <number> --body "## Design Refined

Variant **<X>** refined with the following requirements:
$(for each refinement: "- <requirement>")

**Artifacts:**
- Refined mockup: \`claude_design/mockups/<component-name>/refined.html\`
- Design summary: \`claude_design/mockups/<component-name>/SUMMARY.md\`
- Updated brief: \`claude_design/design_briefs/<BRIEF_NAME>.md\`

Open \`refined.html\` in a browser to review the design. \`SUMMARY.md\` lists exact Svelte components to reuse, what needs to be built, and key implementation notes."
```

### Step 9: Screenshot & Report

Open `refined.html` in Chrome DevTools MCP and screenshot for the user.

Report:

- `refined.html` path
- `SUMMARY.md` path
- Components to reuse (count + names)
- Components adopted (if any)
- GitHub issue comment link

## File Organisation Convention

```
claude_design/mockups/
├── assigned-issues-panel/
│   ├── variant-a.html          ← kept for reference
│   ├── variant-b.html          ← kept for reference
│   ├── refined.html            ← authoritative design (post-refine)
│   └── SUMMARY.md              ← component map + decisions
├── workspace-card/
│   ├── variant-c.html
│   ├── variant-d.html
│   ├── refined.html
│   └── SUMMARY.md
└── ...
```

- Variant files are **kept** after refinement — they remain useful as reference for why decisions were made.
- `refined.html` and `SUMMARY.md` are the two authoritative artefacts consumed by implementation.
- The brief is updated in-place (no renaming).

```

- Each component gets its own folder: `claude_design/mockups/<component-name>/`
- Folder name matches brief name: `SOME_BRIEF_NAME.md` → `some-brief-name/`
- Variants live in the folder: `variant-a.html`, `variant-b.html`, etc.
- Final lives in the folder: `final.html`
- After refinement: only `final.html` remains (variants deleted)
- Never place final mockups in the mockups root directory
```

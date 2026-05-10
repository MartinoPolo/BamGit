---
name: gk-design-brief
description: 'Guide creation of a Grovekeeper design brief with component inventory and recommendations. Use when: "design brief", "create brief", "design spec", "write brief", "component spec", "UI spec"'
argument-hint: '[component-name]'
allowed-tools: Read, Write, Glob, Grep, Agent
metadata:
    author: MartinoPolo
    version: '0.3'
    category: design
---

# Design Brief Creation

Guide the creation of a design brief for a Grovekeeper UI component.

## Available UI Components

!`ls src/lib/components/ui/ 2>/dev/null | sort`

## Existing Designs

!`ls designs/ 2>/dev/null`

## Process

### Step 1: Read Design System & Existing Briefs

Read `designs/DESIGN_SYSTEM.md` for design system reference.
Read 1-2 existing briefs from `designs/<any-component>/DESIGN_BRIEF_*.md` to match the established format.

### Step 2: Determine Container Context

Before writing the brief, determine whether this component lives inside an existing container:

- **Bottom panel tab content**: Component fills a tab content area. Tab bar/chrome belong to parent — component must NOT include its own header, tab bar, outer border, or footer.
- **Session view tab content**: Session chrome (top bar, tab bar, sidebar) belongs to parent; component fills only the content area.
- **Modal / Dialog**: Component owns its own chrome.
- **Standalone page**: Component owns the full viewport.
- **Card / Inline**: Embedded in a list or grid; owns its own boundary.

To identify the container:

1. Where is this component mounted? (`grep -r "ComponentName" src/`)
2. Which layout component wraps it?
3. What chrome does the parent already provide?

Read the parent component if one exists to understand what it provides (tab bar style, border treatment, padding).

### Step 3: Inventory Available Components

Scan Storybook stories: `ls src/lib/components/**/*.stories.svelte`

For each component relevant to the feature, read the story for available variants and props.

### Step 4: Research Missing Primitives

If the feature needs UI patterns not in the inventory:

- Spawn `mp-context7-docs-fetcher` to check shadcn-svelte (`/huntabyte/shadcn-svelte`) and Bits UI (`/huntabyte/bits-ui`)
- Include as "Components to Adopt" in the brief

### Step 5: Draft the Brief

**Folder**: `designs/<component-name>/` (kebab-case)
**File**: `designs/<component-name>/DESIGN_BRIEF_<COMPONENT_NAME>.md` (screaming snake case)

```markdown
# Component Name — Design Brief

[Purpose. What it does, why it matters.]

## Design Tokens

Use the Grovekeeper Forest Moss palette from `designs/tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: [parent component name, or "Standalone"]
**What parent provides**: [tab bar, panel border, resizer, etc.]
**What this component fills**: [e.g., "content area below the active tab, full width × remaining height"]
**Must NOT include**: [e.g., "tab bar, panel header, outer border — these belong to the parent"]

**Mockup rendering**: Show the parent container at reduced opacity as read-only context. The
designed component fills only its designated area. Standalone components own their full chrome.

## Purpose

[What this component does and why it matters]

## Required Elements

### [Subsection]

- [Detailed requirements as bullet points]

## States

List every state that must be designed:

- Default / loading / empty
- Hover / focus / active / disabled
- Error / warning / success
- [component-specific states]

## Reusable Components

Specify which existing components to use:

- Button: `.gk-btn-sm` for inline actions, `.gk-btn-primary` for CTAs
- Badge: `.gk-badge-success/warning/danger` for status indicators
- [component]: [specific usage + props/variants]

## Components to Adopt

shadcn-svelte or Bits UI components to install if needed:

- [component] from shadcn-svelte — [purpose]

## Layout Constraints

[Sizing, spacing, responsive behavior]

## Visual References

[Existing components to feel consistent with; external inspiration]

## UI Freedom

[Areas where the designer has creative latitude]

## Not Included

[Explicit scope exclusions]
```

### Key Principles

- **Specify components, not appearance**: Say "use `.gk-badge-success`" not "green pill"
- **Leave structural choices open**: Specify WHAT exists, let variants explore HOW to arrange it
- **Enumerate all states**: Every interactive element needs states listed
- **Container context is mandatory**: Always specify parent container to prevent chrome duplication

### Step 6: Save & Proceed

Save the brief. After saving, automatically invoke `/gk-mockup` to generate visual variant(s).

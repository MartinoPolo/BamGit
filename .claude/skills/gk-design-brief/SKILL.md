---
name: gk-design-brief
description: 'Guide creation of a Grovekeeper design brief with component inventory and recommendations. Use when: "design brief", "create brief", "design spec", "write brief", "component spec", "UI spec"'
argument-hint: '[component-name]'
allowed-tools: Read, Write, Glob, Grep, Agent
metadata:
    author: MartinoPolo
    version: '0.2'
    category: design
---

# Design Brief Creation

Guide the creation of a design brief for a Grovekeeper UI component. Specify which existing components to reuse while leaving room for design creativity in layout and interaction patterns.

## Available UI Components

!`ls src/lib/components/ui/ 2>/dev/null | sort`

## Existing Briefs

!`ls claude_design/design_briefs/ 2>/dev/null`

## Process

### Step 1: Read Design System & Existing Briefs

Read `claude_design/DESIGN_SYSTEM.md` for design system reference.
Read 1-2 existing briefs from `claude_design/design_briefs/` to match the established format and quality bar.

### Step 2: Determine Container Context

Before writing the brief, determine whether this component lives inside an existing container:

- **Bottom panel tab content**: Component fills a tab content area in the bottom panel. The tab bar, panel chrome, and resizer belong to the parent (`WorkspaceBottomPanel`). The component must NOT include its own header, tab bar, outer border, or footer — it only fills the content area below the tab bar.
- **Session view tab content**: Component fills a tab in the session view header. The session chrome (top bar, tab bar, sidebar) belongs to the parent. The component fills only the content area.
- **Modal / Dialog**: Component is a standalone modal. It owns its own chrome.
- **Standalone page**: Component owns the full viewport area.
- **Card / Inline**: Component is embedded inline in a list or grid. It owns its own boundary.

To identify the container, check:

1. Where is this component mounted in the existing codebase? (`grep -r "ComponentName" src/`)
2. Which layout component wraps it?
3. What chrome (headers, tabs, borders, footers) does the parent already provide?

**Read the parent component** if one exists to understand exactly what the parent provides (tab bar style, border treatment, padding).

### Step 3: Inventory Available Components

Scan Storybook stories for a full component inventory:

```
ls src/lib/components/**/*.stories.svelte
```

For each component relevant to the feature, read the story to understand available variants and props.

### Step 4: Research Missing Primitives

If the feature needs UI patterns not in the inventory:

- Spawn `mp-context7-docs-fetcher` to check shadcn-svelte (`/huntabyte/shadcn-svelte`) and Bits UI (`/huntabyte/bits-ui`)
- Note which components could be adopted
- Include as "Components to Adopt" recommendations in the brief

### Step 5: Draft the Brief

Save to `claude_design/design_briefs/COMPONENT_NAME.md`. Follow this structure:

```markdown
# Component Name — Design Spec

[Purpose. What it does, why it matters. "Hand this to a designer for visual exploration."]

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Container Context

[CRITICAL — determines what the mockup must and must not include]

**Parent**: [parent component name, e.g., "WorkspaceBottomPanel tab content area"]
**What parent provides**: [list: tab bar, panel border, resizer handle, etc.]
**What this component fills**: [e.g., "the content area below the active tab, full width × remaining height"]
**Must NOT include**: [e.g., "tab bar, panel header, outer border, footer — these belong to the parent"]

**Mockup rendering**: Show the parent container (tab bar with correct tab active, panel border) as
read-only context at reduced opacity. The designed component fills its designated area within that
context. This lets the viewer see where the component lives without confusing parent chrome with
component design.

[If standalone/modal: "This component is standalone — it owns its full chrome."]

## [Feature Area] Purpose

[What this section does and why]

## Required Elements

### [Subsection]

- [Detailed requirements as bullet points]

## Reusable Components

[Specify which existing components to use, with variants/props]

- Button: `.gk-btn-sm` for inline actions, `.gk-btn-primary` for CTAs
- Badge: `.gk-badge-success/warning/danger` for status indicators
- Card: `.gk-card` for content containers
- Input: `.gk-input` (32px) for text fields
- [component]: [specific usage guidance]

## Components to Adopt

[shadcn/Bits UI components to install if needed]

- Consider: [component] from shadcn-svelte for [purpose]

## Layout Constraints

[Sizing, spacing, responsive behavior]
[Reference: .gk-btn-sm (26px), .gk-badge (20px), .gk-input (32px)]

## States to Explore in Variants

[States to show in initial variants]

[States to design after variant selection:]

- [Full state enumeration for later]

## Visual References

[Existing components to match, external inspiration]

## UI Freedom

[Areas where the designer has creative latitude]

## Not Included

[Explicit scope boundaries]
```

### Key Principles

- **Specify components, not appearance**: Say "use `.gk-badge-success`" not "green pill shape"
- **Leave structural choices open**: Specify WHAT elements exist, let variants explore HOW to arrange them
- **Enumerate all states**: Every interactive element needs states listed (even if designed later)
- **Reference existing patterns**: Point to other components that should feel consistent
- **Three variants must be structurally distinct**: Different layouts, not just color/spacing variations
- **Container context is mandatory**: Every brief must specify its parent container. Mockups that duplicate parent chrome (adding tab bars, borders, footers that belong to the parent) create misleading designs that won't translate to implementation.

### Step 6: Save & Proceed

Save the brief. The brief is a working document — any issues will surface during mockup review and can be corrected then.

After saving, automatically invoke `/gk-mockup` to generate visual variant(s) from this brief.

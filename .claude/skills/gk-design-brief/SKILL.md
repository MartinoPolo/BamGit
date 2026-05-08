---
name: gk-design-brief
description: 'Guide creation of a Grovekeeper design brief with component inventory and recommendations. Use when: "design brief", "create brief", "design spec", "write brief", "component spec", "UI spec"'
argument-hint: '[component-name]'
allowed-tools: Read, Write, Glob, Grep, Agent
metadata:
    author: MartinoPolo
    version: '0.1'
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

### Step 2: Inventory Available Components

Scan Storybook stories for a full component inventory:

```
ls src/lib/components/**/*.stories.svelte
```

For each component relevant to the feature, read the story to understand available variants and props.

### Step 3: Research Missing Primitives

If the feature needs UI patterns not in the inventory:

- Spawn `mp-context7-docs-fetcher` to check shadcn-svelte (`/huntabyte/shadcn-svelte`) and Bits UI (`/huntabyte/bits-ui`)
- Note which components could be adopted
- Include as "Components to Adopt" recommendations in the brief

### Step 4: Draft the Brief

Save to `claude_design/design_briefs/COMPONENT_NAME.md`. Follow this structure:

```markdown
# Component Name — Design Spec

[Purpose. What it does, why it matters. "Hand this to a designer for visual exploration."]

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Generate Three Distinct Variants

[Three structurally different approaches. Each explores a different layout/interaction
pattern. All must include every required element listed below.]

**Variant A — [approach name]**: [structural description]
**Variant B — [approach name]**: [structural description]
**Variant C — [approach name]**: [structural description]

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

### Step 5: Save & Proceed

Save the brief. The brief is a working document — any issues will surface during mockup review and can be corrected then.

After saving, automatically invoke `/gk-design-3mockups` to generate visual variants from this brief.

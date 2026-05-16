---
name: gk-design-brief
description: 'Guide creation of a Grovekeeper design brief with component inventory and recommendations. Use when: "design brief", "create brief", "design spec", "write brief", "component spec", "UI spec"'
argument-hint: '[component-name]'
allowed-tools: Read, Write, Glob, Grep, Agent, WebFetch
metadata:
    author: MartinoPolo
    version: '0.4'
    category: design
---

# Design Brief Creation

Guide the creation of a comprehensive, standalone design brief for a Grovekeeper UI component. The brief must be complete enough that a designer (human or AI) can produce a pixel-accurate mockup without asking clarifying questions.

## Philosophy

1. **Context is king** — every component lives somewhere. Show WHERE it lives, WHAT surrounds it, and HOW MUCH SPACE it has. A bottom panel tab has ~75% of viewport height. A sidebar settings page shares space with the nav. A modal floats. The mockup must reflect actual proportions.
2. **Reuse over invention** — always specify which existing components to reuse (Button variants, Badge styles, Tabs, etc.). Only design new primitives when no existing component fits.
3. **Requirements-driven** — scrape every source: GitHub issues, PRDs, `.mpx/` docs, `DECISIONS.md`, existing implementations. Human decisions (from grilling sessions, issue comments, PRD text) take highest priority.
4. **Complete standalone** — the brief should be self-contained. Anyone reading it understands the full picture without needing to cross-reference other files.

## Gold Standard Reference

Read `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md` — this is the quality bar. Note:

- Exhaustive state enumeration with exact visual treatments
- Specific component reuse (button variants, badge styles, color utilities)
- Precise pixel values and layout constraints
- Design freedom clearly separated from non-negotiable constraints
- Cross-variant consistency rules

Also read variant mockups `designs/issue-card-v2/variants/variant-{f,g,h}.html` — these demonstrate beautiful component design using our design system well. Take inspiration from their visual quality.

## Available UI Components

!`ls src/lib/components/ui/ 2>/dev/null | sort`

## Existing Designs

!`ls designs/ 2>/dev/null`

## Process

### Step 1: Gather ALL Requirements

Before writing anything, exhaustively research the feature:

1. **GitHub issues**: Search for related issues/PRDs via `gh issue list --search "<keywords>"`. Read issue bodies, comments, and linked PRDs. Human decisions in comments are highest priority.
2. **Project docs**: Read `.mpx/CONTEXT.md`, `.mpx/DECISIONS.md`, and any `.mpx/archive/` files mentioning this feature.
3. **Existing implementation**: If any code exists for this feature, read it. Understand current state vs. desired state.
4. **Related briefs**: Read any related design briefs (e.g., if designing a bottom panel tab, read the bottom-panel-multipanel brief).
5. **Design system**: Read `designs/DESIGN_SYSTEM.md` for available classes and patterns.

### Step 2: Determine Surrounding Context (Critical)

This is the MOST IMPORTANT step. Every component exists within a visual hierarchy. Determine:

#### Where does this component live?

- **Bottom panel tab content**: The bottom panel occupies ~75% of main area height. Forest view is above (~25%). The panel has a tab bar. Content area is spacious — even multi-panel splits fit comfortably. Show forest (small, above), resizer, tab bar, then your content.
- **Bottom panel multi-panel split**: One panel within a horizontal split. Still has significant space.
- **Sidebar content** (e.g., settings): Content replaces the sidebar's nav items. Must include back button at top. Sidebar is ~240px wide expanded.
- **Full page (Overview)**: No sidebar, no forest. Full viewport.
- **Modal/Dialog**: Floats above everything. Specify backdrop treatment.
- **Card/Inline**: Embedded in a grid or list. Owns its boundary.

#### What is the current state of surrounding elements?

If surrounding context is already implemented or designed to a near-final state, represent it faithfully:

- **Dashboard sidebar** (`DashboardSidebar.svelte`): FINAL STATE — always show accurately when displaying page-level dashboard content. Items: brand mark, workspace selector, nav items (Dashboard, Sessions, AI Config, Usage, Workspace Settings), language switcher, theme toggle, user avatar + settings gear.
- **TopBar** (`TopBar.svelte`): FINAL STATE — dashboard name + subtitle (left), sync/notifications/quick-ideas/toggle-forest/create-issue buttons (right).
- **Forest panel**: ~25% of main area height, collapsible. Shows tree visualizations.
- **Bottom panel tab bar**: Styled tabs with the component's tab active.
- **StyledPaneResizer**: 4px height, centered 8px pill indicator between forest and bottom panel.

#### Document context explicitly in the brief:

```markdown
## Surrounding Context

**Viewport layout** (top to bottom, left to right):

- [Exact description of what's visible at the same time as this component]
- [Proportions: "forest ~25% height, bottom panel ~75% height"]
- [What's in FINAL state vs. what's still being designed]

**Mockup rendering instructions**:

- Show full viewport with all surrounding chrome at actual proportions
- Surrounding elements at full fidelity (not reduced opacity) when in final state
- [Component being designed] clearly highlighted/focused
- Use actual proportions — bottom panel is LARGE, forest is SMALL
```

### Step 3: Inventory Existing Components to Reuse

This is critical — designers must know what building blocks are available:

1. Scan Storybook stories: `ls src/lib/components/**/*.stories.svelte`
2. Read `src/lib/components/ui/` — all shadcn-svelte components available
3. Read `src/lib/components/shadcn/button/button-variants.ts` for Button variant options
4. Read `src/lib/components/shadcn/badge/badge-variants.ts` for Badge variant options

For each component relevant to the feature, document:

- **Name** and import path
- **Available variants/props** (e.g., Button: default, destructive, outline, secondary, ghost, link, ghost-overlay)
- **Where to use it** in this design (e.g., "Use `ghost` variant for toolbar actions, `default` for primary CTA")

Be specific: say "use `Button variant='ghost'` with icon-only size" NOT "add a button."

### Step 4: Research Missing Primitives

If the feature needs UI patterns not in the inventory:

- Spawn `mp-context7-docs-fetcher` to check shadcn-svelte (`/huntabyte/shadcn-svelte`) and Bits UI (`/huntabyte/bits-ui`)
- Include as "Components to Adopt" with rationale for why existing components don't suffice

### Step 5: Draft the Brief

**Folder**: `designs/<component-name>/` (kebab-case)
**File**: `designs/<component-name>/DESIGN_BRIEF_<COMPONENT_NAME>.md` (screaming snake case)

Use this structure (all sections mandatory unless marked optional):

```markdown
# Component Name — Design Brief

[One-paragraph purpose statement. What it does, why it matters to the user, what problem it solves.]

**Source**: [PRD #, issue #, or feature area]
**Gold standard reference**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`

---

## 1. Purpose

[Expanded purpose. What workflow does this enable? What's the user's mental model? What question does this UI answer at a glance? Why does this matter enough to design carefully?]

**Key value**: [One sentence — the elevator pitch for this component's existence]

---

## 2. Surrounding Context

The mockup **MUST** show the full viewport with all chrome elements at correct proportions.

### Full Viewport Structure (describe actual layout)

[Describe every element visible alongside this component. Be exhaustive:]

**Left Sidebar** (~240px):

- [List actual current sidebar items if this is a dashboard page]
- Source: `ComponentName.svelte`

**Main Area**:

- [TopBar, Forest panel, Bottom panel, or whatever applies]
- [Proportions: exact percentages or px values]

**What parent provides**: [tab bar, panel border, resizer, etc.]
**What this component fills**: [e.g., "content area below the active tab, full width × remaining height"]
**Must NOT include**: [e.g., "tab bar, panel header, outer border — these belong to the parent"]

**Mockup rendering instructions**:

- Show full viewport at ~1440×900 proportions
- Sidebar in FINAL state (show accurately as implemented)
- [Component area] is the focus — other areas show real content but no design exploration
- [Specific proportion notes: "bottom panel gets ~75% of the 900px minus TopBar"]

---

## 3. Requirements

### 3.1 [Subsection Name]

[Requirements as detailed bullet points. Include:]

- What data is shown (field names, sources, types)
- What actions are available (click targets, keyboard shortcuts)
- What happens on interaction (navigation, state changes, API calls)
- Edge cases (empty state, loading, error, overflow, truncation)

### 3.2 [Next Subsection]

[Continue with all requirement areas. Be exhaustive.]

---

## 4. States

List EVERY state this component can be in:

| State                     | Visual Treatment | Trigger |
| ------------------------- | ---------------- | ------- |
| Default                   | [description]    | [when]  |
| Loading                   | [description]    | [when]  |
| Empty                     | [description]    | [when]  |
| Error                     | [description]    | [when]  |
| Hover                     | [description]    | [when]  |
| Active/Focus              | [description]    | [when]  |
| Disabled                  | [description]    | [when]  |
| [feature-specific states] |                  |         |

---

## 5. Component Reuse Map

### Existing Components (MUST use)

| Component | Variant/Props                 | Usage in This Design    |
| --------- | ----------------------------- | ----------------------- |
| Button    | `variant="ghost"` size="icon" | Toolbar action buttons  |
| Button    | `variant="default"`           | Primary CTA             |
| Badge     | `variant="success"`           | Status indicators       |
| Tabs      | default                       | Panel section switching |
| [etc.]    |                               |                         |

### Components to Adopt (install from shadcn-svelte)

| Component | Source        | Rationale                                  |
| --------- | ------------- | ------------------------------------------ |
| [name]    | shadcn-svelte | [why existing components don't cover this] |

### Components to Design (new)

| Component | Description    | Why New                           |
| --------- | -------------- | --------------------------------- |
| [name]    | [what it does] | [why no existing component works] |

---

## 6. Layout Constraints

- [Minimum/maximum dimensions]
- [Grid/flex behavior]
- [Responsive rules if any]
- [Spacing system: use --space-N tokens]
- [Typography: which gk- classes for what]

---

## 7. Design Tokens

Use the Grovekeeper Forest Moss palette from `designs/tokens.css`:

- Font: Geist (sans) / Geist Mono (mono)
- [List specific tokens relevant to this component]
- [Color semantics: success/warning/danger/info uses]
- [Which accent colors appear and why]

---

## 8. Design Constraints (Non-Negotiable)

[Things the designer CANNOT change:]

- [Specific layout rules]
- [Component reuse requirements]
- [Accessibility requirements]
- [Consistency requirements with other components]
- [Technical constraints (e.g., "must work in 240px sidebar width")]

---

## 9. Design Freedom

[Areas where the designer HAS creative latitude:]

- [Layout arrangement options]
- [Animation/transition choices]
- [Visual emphasis approaches]
- [Information hierarchy within constraints]
- [Specific aesthetic choices: shadows, borders, gradients]

---

## 10. Visual References

- **Internal**: [existing components to feel consistent with — list with file paths]
- **Issue card v2 variants F/G/H**: inspiration for [specific aspects — gradient treatments, density, badge styling]
- **External** (optional): [inspiration links or descriptions]

---

## 11. Not Included (Scope Exclusions)

[Explicitly state what's OUT of scope to prevent scope creep:]

- [Feature X — belongs to PRD #Y]
- [Interaction Z — future iteration]
```

### Key Principles for Writing the Brief

1. **Specify components, not appearance**: Say "use `Button variant='ghost'` size='icon'" not "ghost-styled icon button." Reference exact variant names from our component library.
2. **Proportions matter**: If this lives in the bottom panel, the mockup MUST show that the bottom panel is the dominant visual element (~75% height). Don't show equal-sized panels when one is 3x larger.
3. **Requirements from humans beat requirements from code**: If a grilling session or issue comment says "do X," that overrides what the current code does.
4. **Complete state enumeration**: Every interactive element needs ALL states listed. Missing states = designer invents them = inconsistency.
5. **Container context is mandatory**: Always specify parent container. Show it in the mockup faithfully. Never let the designed component duplicate parent chrome.
6. **Match existing implementations**: If the sidebar, topbar, or any other element is in final state, the mockup should reproduce it accurately — not invent new versions of settled elements.
7. **Explain WHY, not just WHAT**: For every requirement, explain the user benefit. "Shows worktree path because developers need to know which folder to cd into."

### Step 6: Save & Proceed

Save the brief. After saving, automatically invoke `/gk-mockup` to generate visual variant(s).

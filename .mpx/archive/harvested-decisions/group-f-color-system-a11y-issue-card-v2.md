# Group F: Color System, Accessibility, Issue Card v2 Redesign

Extracted from sessions: 2026-05-15. Source sessions:

- `d40f2284` (950KB, 2026-05-15) — color system & component audit
- `e73308cf` (4.5MB, 2026-05-15) — accessibility enforcement
- `3f9cbc71` (4.3MB, 2026-05-15) — issue card v2 redesign

---

## Session 1: Color System & Component Audit (d40f2284)

- **Topic**: Dark mode `--primary` vs `--accent` token distinction
  **Question**: All 12 accent themes set identical values in dark mode. Fix?
  **Answer**: Distinct dark-mode shades — primary lighter/prominent, accent slightly more muted.
  **Category**: UI-Design

- **Topic**: Dark mode lightness gap
  **Question**: Same ~0.185 gap as light mode, or narrower?
  **Answer**: Narrower ~0.08–0.10 gap. Dark backgrounds amplify brightness differences.
  **Category**: UI-Design

- **Topic**: Vocabulary for accent color tokens
  **Question**: Document `--accent` and `--accent-fg` too?
  **Answer**: Yes, but use "for example" language — don't lock to exhaustive token list.
  **Category**: UI-Design

- **Topic**: Ghost overlay story fix scope
  **Question**: Fix only, or also add more test scenarios?
  **Answer**: Fix + add dark card, dark surface, status-colored header scenarios.
  **Category**: UI-Design

- **Topic**: Storybook story grouping strategy
  **Question**: Sub-categories or flat alphabetical?
  **Answer**: Flat alphabetical. Predictable, zero maintenance.
  **Category**: UI-Design

- **Topic**: Event propagation playground story
  **Question**: Dedicated playground, per-story additions, or skip?
  **Answer**: Dedicated `Playground/EventPropagation` story. Parent turns red on leaked Escape.
  **Category**: UI-Design

- **Topic**: Event propagation — which components
  **Question**: Which components stop propagation?
  **Answer**: Identify all and mention in playground. Escape in dropdown must not propagate to parent.
  **Category**: UI-Design

- **Topic**: Native `<select>` migration
  **Question**: Migrate all 4 unstyled native `<select>` elements?
  **Answer**: Yes — migrate all 4. Also scan for shared logic worth wrapping.
  **Category**: UI-Design

- **Topic**: SimpleTooltip rename
  **Question**: Rename `WithTooltip` → `SimpleTooltip`?
  **Answer**: Yes. "Simple" better describes the API.
  **Category**: UI-Design

- **Topic**: SimpleTooltip `delayDuration` prop
  **Question**: Add per-instance override?
  **Answer**: Yes. Useful for instant (0ms) on toolbars vs deliberate (700ms) on info icons.
  **Category**: UI-Design

- **Topic**: SimpleDropdownMenu wrapper
  **Question**: Create wrapper accepting `items` array?
  **Answer**: Yes — flat item list only; complex menus use full composition.
  **Category**: UI-Design

- **Topic**: Extending wrapper pattern
  **Question**: SimpleContextMenu, SimplePopover, etc.?
  **Answer**: No — only SimpleTooltip and SimpleDropdownMenu justified (2+ usage rule).
  **Category**: UI-Design

- **Topic**: Tooltip story consolidation
  **Question**: Merge stories after rename?
  **Answer**: Yes — consolidate into one file.
  **Category**: UI-Design

---

## Session 2: Accessibility Enforcement (e73308cf)

- **Topic**: Icon-only button labeling (`button-name` axe rule)
  **Question**: 895+ icon-only buttons lack `aria-label`. Strategy?
  **Answer**: Require `aria-label` on all icon-only buttons at call site. Fix all production violations. Add eslint/oxlint rule to prevent regressions, re-enable axe rule.
  **Category**: UI-Design

- **Topic**: Color contrast audit (`color-contrast` axe rule)
  **Question**: Fix all or defer?
  **Answer**: Fix `--foreground-subtle` now (fails WCAG AA at ~2.9:1 light / ~3.3:1 dark). Defer full audit — mobile/Android may affect color system.
  **Category**: UI-Design

- **Topic**: Nested interactive elements (`nested-interactive` axe rule)
  **Question**: `Tooltip.Trigger` wraps `<Button>`. Fix how?
  **Answer**: Fix stories to use `child` snippet pattern (production already correct). Re-enable axe rule.
  **Category**: UI-Design

---

## Session 3: Issue Card v2 Redesign (3f9cbc71)

- **Topic**: Color identity approach
  **Question**: Gradient header, thin stripe, left accent bar, or explore all?
  **Answer**: Explore gradients as main freedom area. Avoid left colored border (AI design cliché). Play with header bg and card bg.
  **Category**: UI-Design

- **Topic**: Variant exploration scope
  **Question**: Different layouts or same layout with varied styling?
  **Answer**: Same layout, varied styling. All 5 keep current anatomy; variants differ in color treatment, borders, shadows, gradients.
  **Category**: UI-Design

- **Topic**: Non-adopted issues placement
  **Question**: Ghost cards in same grid, accordion, or separate tab?
  **Answer**: Accordion with ghost cards below adopted grid. Header shows count + sort/filter buttons. Both sections get view switcher (card vs compact row).
  **Category**: UI-Design

- **Topic**: Card preview area
  **Question**: Size and content?
  **Answer**: Single ~100px area. Tree if assigned, character portrait if pack active, empty placeholder for non-adopted. Not smaller than 100px.
  **Category**: UI-Design

- **Topic**: Card state design completeness
  **Question**: Fully design all states or focus on core?
  **Answer**: Core states + session variants. Defer dragging/loading/disabled.
  **Category**: UI-Design

- **Topic**: Visual consistency with WorkspaceCard
  **Question**: Reuse WorkspaceCard's visual utilities or independent?
  **Answer**: Maximum creative freedom — design from scratch, then unify what makes sense. They're never visible simultaneously. Both must respect token system and use base components.
  **Category**: UI-Design

- **Topic**: Assigned accordion — ghost cards vs compact rows
  **Question**: Ghost cards or table-like rows?
  **Answer**: Ghost cards as primary. Also introduce compact row view for both sections with global view switcher. Drop per-card collapse/expand.
  **Category**: UI-Design

- **Topic**: Gradient direction constraints
  **Question**: Specify directions or leave free?
  **Answer**: Fully free exploration — no constraints.
  **Category**: UI-Design

- **Topic**: Ghost card color identity
  **Question**: Any color, or neutral gray?
  **Answer**: Neutral gray default. Exception: specific GitHub labels (e.g., "design needed" = orange) give subtle tint. Label colorization is user-configurable. Multi-label: explore split-gradient.
  **Category**: UI-Design

- **Topic**: Ghost card adopt action
  **Question**: Single "Adopt" or split button?
  **Answer**: Split button (new component needed). "Adopt with Worktree" default. Dropdown for alternatives. Last selection becomes new default.
  **Category**: UI-Design

- **Topic**: Assigned Issues tab retention
  **Question**: Remove tab (replaced by accordion)?
  **Answer**: Defer — design accordion first, then decide.
  **Category**: UI-Design

- **Topic**: Compact row view density
  **Question**: Minimal, medium, or designer-determined?
  **Answer**: Use Obsidian plugin as inspiration: PRD#/issue#, title, badges, contextual buttons. Smart responsiveness: buttons → three-dot, badges → icon-only.
  **Category**: Workflow

- **Topic**: Ghost card content
  **Question**: What to show?
  **Answer**: Same structure as adopted but most fields empty. Always show: title, #number, PRD parent, GitHub labels (grayed except colorized), priority badge, GitHub state, Adopt split-button. Never show: tree/character preview, folder/terminal/editor buttons, worktree/branch/PR/sync badges.
  **Category**: UI-Design

- **Topic**: Done state mechanism
  **Question**: New DB status or derived at render?
  **Answer**: Derived — `github_issue_state='closed'` + `pr_state='merged'`. No DB change.
  **Category**: Data-State

- **Topic**: Executing session visual treatment
  **Question**: Steady glow, oscillation, or header brightness?
  **Answer**: No animation for executing. Animations reserved for critical states (error = red pulse, HITL = amber pulse). Header brightness boost where applicable.
  **Category**: UI-Design

- **Topic**: Subissues chip
  **Answer**: Remove entirely — PRDs won't be represented by these cards.
  **Category**: UI-Design

- **Topic**: Active/selected ring treatment
  **Answer**: Tone down — use glows/inset shadows, not thick 3px rings. Green for active, blue for selected. No checkbox.
  **Category**: UI-Design

- **Topic**: Contextual action buttons style
  **Answer**: Ghost buttons — no visible background.
  **Category**: UI-Design

- **Topic**: Priority badge text
  **Answer**: Full text, not single-letter abbreviation. Consider bottom-center of preview area.
  **Category**: UI-Design

- **Topic**: Hover state across all card states
  **Answer**: Glow + vertical lift (~2-3px) + slight bg brightening. Always additive on top of all other states.
  **Category**: UI-Design

### Variant Review Rounds (from same session, after mockups generated)

- **Topic**: Session state chip style
  **Answer**: Rectangular (not pill), monospace, dot indicator. Per-state colors: EXECUTING=green, ERROR=red, NEEDS INPUT=amber.
  **Category**: UI-Design

- **Topic**: PRD number format
  **Answer**: `#87 /` not `PRD#87 /`. Clickable link (opens GitHub issue), underline on hover.
  **Category**: UI-Design

- **Topic**: PRD group ring
  **Answer**: Triggers on PRD number hover ONLY, not whole card. Includes hovered card. Ring 25% larger for visibility.
  **Category**: UI-Design

- **Topic**: Executing overlay
  **Answer**: REMOVED entirely. Chip stays, no card glow for executing. Error + Needs Input kept.
  **Category**: UI-Design

- **Topic**: HITL label rename
  **Answer**: "Needs Input" on session chip (not "HITL").
  **Category**: Domain-Language

- **Topic**: Priority badge positions
  **Answer**: 9 positions (all inside preview with padding). 3 badge styles: A=solid, B=borderless dark, C=bordered dark.
  **Category**: UI-Design

- **Topic**: Done state visual
  **Answer**: Transparent bg, NO borders, NO color. Floating dim content. Hover restores card outline.
  **Category**: UI-Design

- **Topic**: Ghost card label tint
  **Answer**: 20-25% default, slider 5-30% in control panel. Mix with neutral #1e1e1e (not themed surface) to prevent green contamination.
  **Category**: UI-Design

- **Topic**: Two-label ghost cards
  **Answer**: Split left/right (orange from left, blue from right, blend in middle). Clearly distinct colors.
  **Category**: UI-Design

- **Topic**: Worktree/branch display
  **Answer**: Folder name only (strip parent). Branch: strip conventional prefix. Single line only — truncate, never wrap.
  **Category**: UI-Design

- **Topic**: Quick-action buttons
  **Answer**: NO bg by default. Standard component sizes. Transparent, bg on hover only.
  **Category**: UI-Design

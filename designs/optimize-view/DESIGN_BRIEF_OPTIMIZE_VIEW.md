# Optimize View (Waste Detection) — Design Brief

Advisory section within the Usage Dashboard (`/usage` route) that scans session history and workspace configuration to detect token waste and configuration issues. Displays findings with actionable fixes and a health score. Inspired by CodeBurn's optimize view, adapted for Grovekeeper's GUI.

**GitHub Issue**: #250 (blocked by #247 — needs real metrics data)
**PRD**: #93 (Metrics & Statistics, requirements 36-38)

---

## 1. Purpose

Help users reduce token waste and improve their AI agent configuration. The view answers two questions:

1. "Am I spending tokens efficiently?" — health score with letter grade
2. "What can I fix to save money?" — prioritized findings with copyable fixes

This is advisory-only: findings are informational, users apply fixes manually outside Grovekeeper. No auto-fixing, no CLI integration. The optimize view turns raw session analytics (already captured by PRD #93) into concrete, actionable savings opportunities.

---

## 2. Surrounding Context

The optimize view is a **section or tab within the Usage Dashboard page** — it is NOT a standalone page. The full viewport layout:

```
+--[Sidebar 240px]--+--[Content Area: fill]------------------------------+
|                    |                                                    |
| BrandMark (logo)   | Usage Analytics header                            |
| WorkspaceSelector  | [today|7d|30d|month|all|custom] [scope] [groupBy] |
|                    |                                                    |
| -- Nav Items --    | [Dashboard tab] [Optimize tab] [Compare tab]      |
| Dashboard (Trees)  |                                                    |
| Sessions (Code)    | +-[OPTIMIZE VIEW CONTENT]-----------------------+ |
| AI Config (Spark)  | | Health score + findings list                  | |
| Usage (Chart) *    | |                                               | |
| WS Settings (Wren) | |                                               | |
|                    | +-----------------------------------------------+ |
| -- Bottom --       |                                                    |
| ThemeToggle        |                                                    |
| LanguageSwitcher   |                                                    |
| UserAvatar         |                                                    |
+--------------------+----------------------------------------------------+
```

**Sidebar**: 240px expanded / 56px collapsed. 5 nav items: Dashboard, Sessions, AI Config, Usage (active), Workspace Settings. Below: theme toggle, language switcher, user avatar. This is FINAL — do not modify.

**Parent**: Usage Dashboard page at `/usage`
**What parent provides**: Page header ("Usage Analytics"), period tabs (today/7d/30d/month/all/custom), scope toggle, group-by dropdown, color theme picker, achievements dialog trigger, refresh indicator, export CSV button
**What this component fills**: A tab panel within the usage page content area (alongside the existing dashboard metrics and the compare view)
**Must NOT include**: Sidebar, topbar, page title, period/scope/group-by filters — all owned by the parent usage page

**Mockup rendering**: Show the usage page header and filter bar at ~40% opacity as read-only context. The optimize view content fills the area below.

---

## 3. Requirements

### 3.1 Health Score

- **Numeric score**: integer 0-100
- **Letter grade**: A (>=90) / B (>=75) / C (>=55) / D (>=30) / F (<30)
- **Grade color mapping**: A/B = green (`--status-success`), C = amber (`--status-warning`), D = orange (between warning and danger), F = red (`--status-danger`)
- **Penalty breakdown text**: `{highCount} high + {medCount} medium + {lowCount} low findings`
- **Formula**: `max(0, 100 - min(80, sum(penalties)))` where high=15, medium=7, low=3 per finding
- **Data source**: Rust command `get_optimize_findings(period: MetricsPeriod) -> OptimizeResult { score, grade, findings }`
- **Period binding**: Inherits the active period from parent usage page filters

### 3.2 Finding Cards (10 Detectors)

Each finding displays:

| Field | Description |
|---|---|
| **Impact badge** | Badge component: high (destructive/red), medium (warning/amber), low (secondary/azure) |
| **Title** | Finding name (e.g., "Reading junk directories") |
| **Summary** | One-line explanation (e.g., "12 reads into node_modules/ detected") |
| **Token savings** | Estimated tokens saved if fixed (e.g., "~7,200 tokens") |
| **Cost savings** | Estimated USD saved (e.g., "~$0.04/session") |
| **Detail** | Expandable: full explanation with specific file/directory names |
| **Fix** | Actionable instruction: copyable command, config snippet, or file content |

### 3.3 Detector Table

| # | Name | Impact | Data Source |
|---|---|---|---|
| 1 | Junk directory reads | High | `tool_usage` — Read calls to node_modules, .git, dist, build, __pycache__, .next, .nuxt, coverage, .cache, .venv |
| 2 | Duplicate file reads | High | `tool_usage` — same file_path read multiple times per session |
| 3 | Low read/edit ratio | High | `tool_usage` — ratio of reads to edits, healthy >= 4:1 |
| 4 | Cache bloat | High | `turn_metrics` — cache_creation_tokens median vs 25th-percentile baseline |
| 5 | Unused MCP servers | Medium | `tool_usage` + filesystem (~/.claude/settings.json) |
| 6 | Bloated CLAUDE.md | Medium | Filesystem — line count with @-import expansion, threshold >200 lines, depth 5 |
| 7 | Ghost agents | Medium | `tool_usage` + filesystem (~/.claude/agents/*.md never used as subagent_type) |
| 8 | Ghost skills | Medium | `tool_usage` + filesystem (~/.claude/skills/*/SKILL.md never invoked) |
| 9 | Ghost commands | Medium | `turn_metrics` (user messages) + filesystem (~/.claude/commands/*.md never referenced) |
| 10 | Bash output limit | Low | Filesystem — shell profile check for BASH_MAX_OUTPUT_LENGTH, recommend 15000 |

### 3.4 Findings List

- **Sorted by urgency**: `impact_weight * 0.7 + (tokensSaved / 500_000) * 0.3`
- **Filterable by impact level** (optional filter, show all by default)
- **Empty state**: "Your configuration is clean!" with health score A (100)
- **Fix actions**: Copy button for commands/config snippets, multi-step fixes numbered

---

## 4. Existing Components to Reuse

| Component | Location | Usage |
|---|---|---|
| `Card.Card` | `shadcn/card/` | Finding card containers, health score card |
| `Badge` | `shadcn/badge/` | Impact level indicators (destructive, warning, secondary) |
| `Button` | `shadcn/button/` | "Copy fix" action buttons, filter toggles |
| `Accordion` | `shadcn/accordion/` | Expandable detail/fix sections within finding cards |
| `Progress` | `shadcn/progress/` | Health score bar visualization |
| `SimpleTooltip` | `shadcn/tooltip/` | Hover explanations on score, metrics, grade |
| `StatCell` | `base/stat-cell/` | Score display with tone variants (neutral/warning/danger) |
| `cn()` | `$lib/utils` | Conditional styling based on grade/impact |
| `.cb-finding` | `tokens.css` | Left-border accent card class for finding cards (`.is-high`, `.is-med`, `.is-low`) |
| `.cb-panel` / `.cb-panel-title` | `tokens.css` | Bracket-style `[HEADING]` section titles for developer aesthetic |
| `.cb-row` / `.cb-num` / `.cb-mute` | `tokens.css` | Dense data rows for finding metadata |
| `RefreshIndicator` | `blocks/usage/` | Already present in parent usage page header |
| `CostLink` | `blocks/usage/` | Clickable cost values linking to usage filters |

---

## 5. Components to Design

| Component | Description | New or Extend |
|---|---|---|
| **HealthScoreDisplay** | Grade letter + numeric score + score arc/ring + penalty breakdown. Prominent top-of-section display. Uses SVG arc or `Progress` ring. | New |
| **FindingCard** | Individual waste finding with impact badge, title, summary, savings, expandable detail+fix. Uses `cb-finding` left-border accent. | New |
| **FindingsList** | Sorted container for FindingCards with optional impact-level filter buttons. Handles empty state. | New |
| **CopyableCodeBlock** | Monospace block with "Copy" ghost button for fix commands/config. Clipboard API. | New |
| **ImpactFilterBar** | Toggle buttons for High/Medium/Low to filter visible findings. Counts per level shown. | New |

---

## 6. Layout & Dimensions

### Health Score Section
- **Position**: Top of optimize tab content, always visible (not scrolled away)
- **Height**: ~100px fixed
- **Structure**: Left = grade ring/arc (SVG, ~80px diameter), center = numeric score + grade letter, right = penalty breakdown text + finding counts
- **Full width** within the content area

### Findings Area
- **Below health score section**
- **Scrollable**, no fixed height limit
- **Optional filter bar** above findings (High | Medium | Low toggles)
- **Single column layout** — findings are full-width cards stacked vertically
- **Finding card minimum height**: ~60px collapsed, ~200px expanded with fix
- **Gap between cards**: `gap-3` (12px)
- **Copy buttons**: `icon-sm` size, right-aligned within fix section

### Responsive Behavior
- At narrow widths (<600px): health score section stacks vertically (ring above, stats below)
- Findings remain single-column at all widths (they need horizontal space for code blocks)

---

## 7. States & Interactions

### 7.1 States to Design (All Required for Mockups)

| State | Description | Visual |
|---|---|---|
| **Score A (clean)** | 0-1 low findings, score 90-100 | Green grade ring, green tone, minimal findings list |
| **Score C (mixed)** | Mixed impact findings, score 55-74 | Amber grade ring, amber tone, several findings visible |
| **Score F (critical)** | Many high-impact findings, score <30 | Red grade ring, red/danger tone, urgent findings prominent |
| **Finding collapsed** | Default state of a finding card | Impact badge + title + summary + savings on one row |
| **Finding expanded** | Detail + fix visible | Accordion opens: full explanation text + copyable fix block |
| **Empty state** | No session data to analyze (new workspace, no imports) | Illustration or icon + "No session data yet. Import sessions or run your first session to get optimization insights." |
| **Loading state** | Analyzing session history + filesystem | Skeleton loaders for score section + pulsing placeholders for findings area |
| **Copy hover** | Mouse over copy button | Ghost button reveals background, tooltip "Copy to clipboard" |
| **Copy success** | After clicking copy | Button briefly shows check icon, returns to copy icon after 2s |
| **Dark mode** | All grade colors, finding accents, code blocks themed | All colors via CSS custom properties, no hardcoded values |
| **Light mode** | Same structure, adjusted token values | Lighter card surfaces, adjusted contrast for impact badges |

### 7.2 Interactions

- **Accordion expand/collapse**: Click on finding card header toggles detail section. Single-item expand (opening one closes others) via `Accordion.Root` with `type="single"`.
- **Copy fix**: Click copies fix text to clipboard. Uses `navigator.clipboard.writeText()`. Shows toast confirmation via `svelte-sonner`.
- **Impact filter**: Click toggles visibility of findings at that impact level. Multiple levels can be active simultaneously. Default: all shown.
- **Period inheritance**: Findings refresh when the parent usage page period changes (already handled by shared context).
- **Tab switching**: Usage page has tabs for Dashboard / Optimize / Compare. Switching to Optimize triggers data load if stale.

---

## 8. Design Constraints (Non-Negotiable)

- Must render within the usage page content area — NOT a standalone page or route
- Must respect parent page's period/scope filters (shared `UsageContext`)
- Must use existing shadcn components (Badge, Card, Button, Accordion, Progress)
- Must use `designs/tokens.css` token system — OKLCH color space, semantic variables
- Must use `cb-finding` accent classes for finding card left borders (`.is-high`, `.is-med`, `.is-low`)
- Typography: Geist (sans) for labels, Geist Mono (mono) for code, numbers, and grades
- Health score formula is fixed: `max(0, 100 - min(80, sum(penalties)))` — penalties: high=15, medium=7, low=3
- Urgency sort formula is fixed: `impact_weight * 0.7 + (tokensSaved / 500_000) * 0.3`
- Advisory only — no auto-fix buttons, no "Apply fix" that modifies files. Copy-only.
- Dark theme is primary, light theme must also work
- No left colored accent border as sole color identity on cards (use the full `.cb-finding` pattern with its defined accent widths)
- 10 detectors exactly — no adding or removing in this phase
- Fix text must be copyable with a single click (no select-all-then-copy)
- Empty state required (cannot just show blank)
- Loading state required (cannot flash from blank to populated)

---

## 9. Design Freedom (Explore in Variants)

- **Health score visualization**: SVG arc/ring, circular gauge, linear progress bar, large letter grade with background, numeric-only with color bar, combination approaches
- **Grade prominence**: Large centered letter vs small badge vs inline with score
- **Finding card density**: Compact single-row (cb-row style) vs spacious cards with padding vs medium density list
- **How detail/fix is revealed**: Accordion slide, fade-in, panel split (list left / detail right as in Variant C), inline expand
- **Whether to use `cb-panel` bracket headings** vs standard `Card.Header` sections
- **Score arc animation**: Animate on initial load (draw arc from 0 to value) vs appear instantly
- **Finding card hover**: Subtle highlight vs no hover effect
- **Whether findings can be dismissed/acknowledged** (mark as "reviewed" — cosmetic only, resets on next analysis)
- **Savings summary**: Total potential savings aggregated above findings vs per-finding only
- **Impact badge placement**: Left of title vs top-right corner vs integrated into left border
- **Code block styling**: Full-width monospace block vs inline code with copy vs terminal-style dark panel

---

## 10. Inspiration & Visual References

- **CodeBurn optimize view**: `C:/_MP_github_cloned/codeburn/src/optimize.ts` — all 10 detectors, scoring logic, finding format, fix text
- **Variant C (Split Detail)**: `designs/optimize-view/variants/variant-c.html` — asymmetric 40/60 split with scannable list left, full context right, SVG arc grade ring, `cb-finding` left-border selection language, mono section titles with `// PREFIX` pattern
- **Existing variants A-E**: `designs/optimize-view/variants/variant-{a,b,c,d,e}.html` — 5 explored mockups already exist
- **StatCell component**: `src/lib/components/base/stat-cell/` — tone variants (neutral/warning/danger) for numeric display
- **Badge component**: `src/lib/components/shadcn/badge/` — impact level indicators
- **Usage Dashboard**: `src/routes/usage/+page.svelte` — parent page structure, KPI cards, existing layout patterns
- **Issue Card v2 quality bar**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md` — target spec quality: exhaustive state cascade, exact CSS token values, component extraction architecture, settings cascade pattern
- **tokens.css `cb-finding` classes**: `designs/tokens.css` lines 1130-1146 — pre-defined left-border accent colors for high (red `oklch(0.64 0.205 25)`), medium (amber `oklch(0.77 0.155 75)`), low (azure `oklch(0.66 0.105 220)`)

---

## 11. Data Contract

### Rust Command

```rust
#[tauri::command]
async fn get_optimize_findings(
    period: MetricsPeriod,
    dashboard_id: Option<i64>,
) -> Result<OptimizeResult, String>
```

### Response Shape

```typescript
interface OptimizeResult {
    score: number;           // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    findings: Finding[];     // sorted by urgency descending
    analyzed_sessions: number;
    analyzed_period: string;
}

interface Finding {
    detector_id: string;     // e.g., "junk_reads", "duplicate_reads"
    title: string;
    impact: 'high' | 'medium' | 'low';
    summary: string;         // one-line explanation
    detail: string;          // full explanation with specifics (file paths, counts)
    token_savings: number;   // estimated tokens saved
    cost_savings_usd: number;// estimated USD saved per session
    fix_text: string;        // copyable fix (command, config snippet, or instructions)
    fix_type: 'command' | 'config' | 'instructions'; // determines copy block style
}
```

### Mock Data

Must be added to `src/lib/tauri_mock_data.ts` for browser mode. Include examples covering:
- Score A (1 low finding), Score C (mixed), Score F (many high findings)
- Each detector type represented at least once
- Fix types: shell command (`echo 'export BASH_MAX_OUTPUT_LENGTH=15000' >> ~/.zshrc`), JSON config (settings.json snippet), multi-step instructions

---

## 12. Not Included (Out of Scope)

- Auto-fixing (findings are advisory, user applies fixes manually)
- Historical score tracking (no trend line for score over time — future enhancement)
- Per-workspace optimize scoring (global only in v1; workspace scoping deferred)
- Integration with Claude Code CLI for automated fix application
- Custom detector configuration (users cannot add/remove/adjust detectors)
- Finding dismissal persistence (if implemented, cosmetic only — resets on re-analysis)
- Notifications for score changes (no push notification when score drops)
- Comparison between periods ("your score improved from C to B this week")

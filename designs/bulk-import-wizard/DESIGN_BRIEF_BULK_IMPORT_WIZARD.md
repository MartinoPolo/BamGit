# Bulk Import Wizard — Design Spec

Multi-step wizard for importing many characters at once from a structured folder (e.g. WC3 voice files organized as `Faction/UnitName/*.wav`). Scans folder hierarchy, proposes characters with auto-mapped sounds, lets user review and adjust before batch-creating packs. Accessed via "Import Folder" button in Settings → Notifications & Characters. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono. Tier colors: `--status-danger` (critical), `--status-warning` (important). Success: `--status-success`.

## Wizard Purpose

When users have a large collection of organized sound files (like extracted game voice lines), creating characters one-by-one is tedious. The bulk wizard scans a folder structure, auto-detects character names from subfolder names, applies filename-pattern auto-mapping rules, and lets the user review before batch-importing. Designed for the WC3 voice file use case (396 characters, 3028 files in `Faction/Unit/` hierarchy) but works with any organized folder.

## Required Elements

### Step 1: Folder Selection & Scan

- **Folder picker**: `.gk-btn-primary` "Select Folder" button — opens native directory dialog
- **Selected path display**: Monospace path text + "Change" link
- **Scan results summary**: After scanning:
  - "{N} characters detected in {M} folders"
  - "{T} total sound files"
  - Folder tree preview showing top-level structure (faction names) with character counts per faction
- **Character checklist**: Each detected character as a row:
  - Checkbox (checked by default)
  - Character name (derived from subfolder name, editable inline)
  - Sound count (`.gk-badge`)
  - Auto-map quality indicator: green check (critical events fillable), amber warning (missing critical), red X (too few sounds)
- **"Select All" / "Deselect All"** toggle in header
- **Filter/search**: `.gk-input` to filter character list by name

### Step 2: Auto-Mapping Review

- **Auto-mapping rules display**: Collapsible info panel showing the mapping rules being applied:
  | Pattern | → Event |
  |---------|---------|
  | `Ready*` | session.start |
  | `What1,What2` | session.needs-input |
  | `What3,What4` | session.end |
  | `Death*` | task.error |
  | `Yes*` | task.acknowledge |
  | `YesAttack*` | task.complete |
  | `Pissed*` | resource.limit |

- **Per-character review**: Expandable accordion rows for each selected character:
  - Header: character name + sound count + mapping status badge (Ready/Incomplete)
  - Expanded: shows event → sound assignments (same layout as character creator event slots, but compact)
  - Inline play buttons on each sound
  - Drag-and-drop to reassign between events
  - Unassigned sounds shown in a "Pool" section within the row
- **Batch status bar**: "{N} ready, {M} incomplete, {K} skipped" summary

### Step 3: Confirmation & Import

- **Import summary**: Card listing all characters to be created:
  - Character name, sound count, event coverage fraction
  - Status: Ready (green) or Incomplete — will be saved but disabled (amber)
- **Avatar notice**: "No avatars detected — characters will use placeholder. You can add avatars later via Edit."
- **Storage estimate**: "~{X} MB will be copied to app data"
- **Import button**: `.gk-btn-primary` "Import {N} Characters"
- **Progress indicator**: During import — progress bar with "{current}/{total} characters" and current character name
- **Completion**: Success message with "View Characters" link back to settings

### Step Navigation

- **Step indicator**: Horizontal 3-dot stepper at top (1: Select, 2: Review, 3: Import)
- **Back/Next buttons**: Footer bar, right-aligned. "Back" is `.gk-btn-ghost`, "Next" is `.gk-btn-primary`
- **Next disabled** until step requirements met (Step 1: at least 1 character selected)

## Reusable Components

- `Button`: primary for actions, secondary for folder picker, ghost for back/change
- `Card.Card`: scan results, character review cards, import summary
- `Badge`: sound counts, mapping status, tier indicators
- `Checkbox`: character selection in step 1
- `Input`: character name inline edit, search filter
- `Separator`: between wizard sections
- `Accordion` (to adopt): per-character expandable review rows in step 2
- `SimpleTooltip`: mapping rule explanations, status badge details
- `cn()`: status-based coloring on quality indicators

## Components to Adopt

- `Accordion` from shadcn-svelte for character review expansion (bits-ui)
- `Progress` from shadcn-svelte for import progress bar
- `Stepper` — custom implementation (3-dot horizontal indicator, not in shadcn-svelte)

## Layout Constraints

- Full page width with `p-6` padding, `max-w-4xl mx-auto` for content centering
- Step indicator: `h-12` fixed top area
- Character list in step 1: `max-h-[calc(100vh-16rem)] overflow-y-auto`
- Accordion rows in step 2: `max-h-[calc(100vh-14rem)] overflow-y-auto`
- Footer navigation bar: sticky bottom, `h-16`, `border-t border-border`, `bg-background`
- Character row height: 44px collapsed, variable expanded
- Import progress card: centered, `max-w-md`

## States to Explore in Variants

- Step 1: folder selected, scan complete, 20+ characters detected with mixed quality indicators
- Step 2: 3-4 characters expanded showing auto-mapped sounds with one incomplete character
- Step 3: import in progress at 60%

States to design after variant selection:
- Empty scan result (folder has no valid sound files)
- Very large scan (100+ characters — virtualized list?)
- Scan in progress (spinner + "Scanning...")
- Name collision (detected character name matches existing installed pack)
- Import complete success state
- Partial import failure (some characters failed)
- Step 2 with drag in progress (sound reassignment)
- Inline character name edit active

## Visual References

- Creation Wizard mockup: `claude_design/Creation Wizard.html` (step-based wizard pattern)
- NotificationSettingsPanel: `src/lib/components/NotificationSettingsPanel.svelte` (tier grouping)
- Character Creator brief: `claude_design/design_briefs/CHARACTER_CREATOR_EDITOR.md` (event slot design, shared pattern)

## UI Freedom

- Whether steps replace each other or scroll as a single page
- Folder tree visualization style (indented list vs actual tree with expand/collapse)
- Character row density in step 1 (compact list vs cards)
- How much of step 2 review detail is shown by default vs behind expansion
- Progress indicator style during import (bar, spinner, percentage)
- Whether step 3 is a separate confirmation or integrated into step 2 as a "done" state

## Not Included

- Single Character Creator/Editor (separate brief: CHARACTER_CREATOR_EDITOR.md)
- Avatar auto-detection from folder (always placeholder for bulk import)
- Sound format conversion during import (handled by Rust backend)
- Custom auto-mapping rule editor (hardcoded WC3 patterns for now)
- Pack export or sharing between users

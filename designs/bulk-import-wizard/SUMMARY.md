# Bulk Import Wizard — Design Summary

**Base**: Variant B | **Refined**: 2026-05-10

## Refinements Applied

Variant B was chosen for its master-detail split layout and refined to align with the character-creator-editor's visual language. See the design brief for full requirements. Key changes from the base variant:

- **Three-panel layout**: the original 2-panel split (tree | detail) was expanded to a 3-panel layout (tree 300px | events flex-1 | sound pool 280px) matching the character editor's structure. The sound pool sidebar is required for drag-and-drop manual overrides of auto-mapped assignments (REQ-4 "full manual override").
- **Sound pool sidebar (right)**: mirrors the character-editor's `sound-sidebar` exactly — header with file count, search filter, scrollable list with drag handles, filenames, durations, and "assigned-to" event indicators. No big import/drop zone (sounds come from folder scan, not manual import). "Clear assignments" button in footer resets all event mappings for the selected character.
- **Sound mapping slots replaced with event cards + sound chips**: the flat `mapping-slot` row pattern was replaced with the character-editor's `event-card` component (border + background state-tinting) and `sound-chip` with primary-colored play button, waveform bars, mono filename, duration, and remove button. This gives both pages identical visual DNA for sound-to-event assignments.
- **Tier sections with collapsible headers**: the static `mapping-section-title` was replaced with the character-editor's borderless, collapsible `tier-section` using colored tier markers (critical=danger glow, important=warning glow), numeric-only progress (`3 / 3 assigned`), and `has-missing` text-color rule that turns labels red/orange when events are unfilled.
- **State-tinted event cards**: empty event cards now use `is-critical-empty` (red border+bg tint) and `is-important-empty` (orange tint), matching the character-editor exactly. Drop zones inside tinted cards inherit the danger/warning color.
- **Drop zones**: replaced the flat `slot-empty-label` with dashed `drop-zone` blocks matching the character-editor (primary + secondary sizes, hover states, state-aware coloring).
- **Inlined theme tokens removed**: the variant's inline `.theme-dark` block was removed; the page now references `tokens.css` via `<link>` only, matching the character-editor pattern.
- **Toolbar aligned**: added a vertical divider between title and path (matching the character-editor's `header-divider`), toolbar background changed from `surface-2` to `surface` for consistency with the character-editor header.
- **Detail header**: avatar uses dashed border (upload-affordance) matching the character-editor's `avatar-upload` pattern. Identity strip background uses `color-mix(surface 50%, background)` matching the character-editor.
- **Footer**: added progress bar with `1px solid var(--border)` outline (matching character-editor's validation-footer) alongside the existing stat dots and storage estimate.
- **Faction tree**: chevron toggle uses `<button>` elements with `aria-expanded` for accessibility, matching the character-editor tier headers. `is-open`/closed via class toggle instead of `is-collapsed`.

## Component Map

### Codebase — Use As-Is

| Component   | Path                               | Usage                                           | Key Props/Variants                                     |
| ----------- | ---------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| `Button`    | `src/lib/components/ui/button/`    | Toolbar change, footer cancel/import, re-map    | `variant="primary" \| "ghost"`, `size="sm" \| "lg"`    |
| `Badge`     | `src/lib/components/ui/badge/`     | Toolbar stats (ready/partial), character status  | `variant="success" \| "warning"` with dot              |
| `Input`     | `src/lib/components/ui/input/`     | Filter characters, character name edit           | default, sm height                                     |
| `Checkbox`  | `src/lib/components/ui/checkbox/`  | Character selection, select-all (indeterminate)  | default + indeterminate state                          |
| `Dialog`    | `src/lib/components/ui/dialog/`    | Modal backdrop + dialog wrapper                  | full-screen centered                                   |
| `Tooltip`   | `src/lib/components/ui/tooltip/`   | Quality indicator detail, mapping rule hints     | `delayDuration={300}`                                  |
| `Separator` | `src/lib/components/ui/separator/` | Toolbar divider                                  | `orientation="vertical"`                               |

### Adopt from shadcn-svelte / Bits UI

| Component   | Source        | Install command                                | Purpose                                                    |
| ----------- | ------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `Accordion` | shadcn-svelte | `pnpm dlx shadcn-svelte@latest add accordion`  | Collapsible tier sections + faction tree expand/collapse   |
| `Progress`  | shadcn-svelte | `pnpm dlx shadcn-svelte@latest add progress`   | Footer progress bar for event coverage                     |

### Build Custom

| Proposed Name        | Description                                                                                                   | Why existing components don't cover it                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `SoundChip`          | Shared with character-editor: primary play button, waveform bars, mono filename, duration, remove × button    | Bespoke compound; shared across import wizard + character editor                |
| `EventSlotCard`      | Shared with character-editor: state-tinted card with event name, id chip, sound count, sounds list, drop zone | Domain-specific state encoding; shared across both sound-management pages       |
| `TierSection`        | Shared with character-editor: borderless collapsible wrapper, tier marker, numeric progress, has-missing rule  | Adds tier-specific visual semantics on top of Accordion                         |
| `FactionTree`        | Left-panel file tree with faction folders and character rows, checkbox selection, quality indicators           | Wizard-specific; not needed in character editor                                 |
| `ImportWizardDialog` | Top-level modal orchestrating toolbar, split layout, footer with stats + progress                             | Wizard-specific layout composition                                              |
| `PoolChipBar`        | Unassigned sounds as draggable chips with play buttons in a flex-wrap grid                                    | Compact pool display for wizard context (vs. character-editor's sidebar list)   |

## Implementation Notes

- **Shared components with character-editor**: `SoundChip`, `EventSlotCard`, and `TierSection` are identical between the import wizard and character editor. Extract them to `src/lib/components/sound/` or `src/lib/components/character/` as shared primitives. Both pages use the same state classes (`is-critical-empty`, `is-important-empty`), the same tier marker colors, and the same sound chip visual structure.
- **Drop zone behavior**: the import wizard uses drop zones for reassigning sounds between events (same as character editor). Source = unassigned pool chip, target = event card drop zone. Use `dataTransfer.setData('application/x-grovekeeper-sound', soundId)` per the character-editor spec.
- **Tier collapse state**: critical tier defaults to open. Standard tier defaults to open during review, normal tier (if present) defaults to closed. Not persisted (wizard is ephemeral).
- **Folder tree selection**: faction headers toggle expand/collapse only (no checkbox). Character rows have individual checkboxes. Select-all in the panel header uses indeterminate state when partially selected. Unchecking a character removes it from the import set (grayed name, quality dot hidden).
- **Quality indicators**: `is-ready` (green) = all critical events have sounds. `is-partial` (warning) = some critical events missing. `is-sparse` (danger) = too few sounds to fill any critical events. Computed from auto-mapping results.
- **Re-map button**: re-runs the auto-mapping rules on the selected character's sounds, resetting manual overrides. Shows a confirmation toast since it's destructive within the wizard session.
- **Import progress**: when "Import N Characters" is clicked, the footer transitions to a progress bar showing `{current}/{total} characters` with the current character name. The tree and detail panels remain visible but become read-only (pointer-events: none, opacity: 0.7).
- **Edge cases**: 0 sounds in unassigned pool → pool section hidden. Character with no sounds at all → shown with `is-sparse` quality and empty detail panel with a message. 100+ characters → tree virtualizes (use Svelte `{#each}` with a scroll container; no library needed for this count).
- **Keyboard navigation**: faction headers and tier headers are real `<button>` elements (Tab-stop, Enter/Space toggles). Character rows focus on Tab. Tree supports ArrowUp/ArrowDown navigation within the faction.
- **Accessibility**: checkboxes use native `<input type="checkbox">` with indeterminate via data-state. Tier toggles set `aria-expanded`. Sound chip remove buttons have `aria-label="Remove"`. Modal uses `role="dialog"` with focus trap.

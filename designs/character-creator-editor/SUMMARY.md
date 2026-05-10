# Character Creator/Editor — Design Summary

**Base**: Variant D | **Refined**: 2026-05-10

## Refinements Applied

Variant D was chosen as the structural and visual base, with the sound-pool **structure** ported from Variant A. See the design brief for the full requirement set. Key changes vs. base:

- **Sound pool moved to right-hand side** with A's affordances (large click-or-drop import zone, search filter, Clear-All adjacent to the list with destructive confirmation dialog).
- **Multi-sound per event** is now first-class: assigned sounds stack vertically inside each event card, followed by a compact "Drop another sound" zone — same visual rhythm whether the slot has 0, 1, or N sounds.
- **Event timeline spine + dot nodes removed** in favor of clean cards whose **border + background tint encode state** (red for unfilled critical, orange for unfilled important, neutral otherwise).
- **Tier sections are collapsible** with numeric-only progress + missing-count in the header. **The section is borderless and background-less** — only event cards carry chrome (the previous outer wrapper border created a double-border next to each event card's own border). State is carried by the tier header *text colour* (label + numbers turn red/orange when missing).
- **Events laid out in a responsive grid** within each tier (`grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: space-3`) so cards sit side-by-side instead of full-width — large reclaim of horizontal space on desktop, graceful fall-back to single column on narrow viewports.
- **Mini per-tier progress bars removed**: their unfilled portion blended with the surface tint and added visual noise without conveying anything the numbers don't. The footer page-wide progress bar is kept (it has an explicit `1px solid var(--border)` outline so the unfilled track is visible).
- Internal event id (`session.needs-input`) sits **inline next to the human-readable name** (Variant A pattern) rather than aligned right.
- Header gained a **`1 critical slot empty` danger badge** for at-a-glance state; footer combines A's icon-save with D's progress bar (`7 / 15 events`); disabled save shows a tooltip naming the missing slot.
- Avatar uses the upload (arrow-into-tray) icon instead of camera; the prior "X / Y assigned" identity meta has been replaced with a **language selector** carrying flag emoji per option.

## Component Map

### Codebase — Use As-Is

| Component        | Path                               | Usage                                                | Key Props/Variants                                  |
| ---------------- | ---------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `Button`         | `src/lib/components/ui/button/`    | Header save/cancel, footer save/cancel, Clear All    | `variant="primary" \| "ghost" \| "destructive"`, `size="sm"` |
| `Badge`          | `src/lib/components/ui/badge/`     | Header "1 critical slot empty"                       | `variant="danger" \| "warning" \| "success"` with dot |
| `Input`          | `src/lib/components/ui/input/`     | Character name, sound-pool filter                    | default                                             |
| `Select`         | `src/lib/components/ui/select/`    | Language selector                                    | needs custom item template (flag + label)           |
| `Dialog`         | `src/lib/components/ui/dialog/`    | "Clear all sounds?" confirmation                     | use `Dialog.Root` + alert pattern                   |
| `Tooltip`        | `src/lib/components/ui/tooltip/`   | Disabled-save explainer; event description on hover  | `delayDuration={300}`                               |
| `Separator`      | `src/lib/components/ui/separator/` | Header divider, footer dividers                      | `orientation="vertical" \| "horizontal"`            |
| `Card`           | `src/lib/components/ui/card/`      | Event card surface, dialog body wrapper              | borderless variant via override                     |
| `cn()`           | `src/lib/utils/cn.ts`              | Drag-over, tier-state, card-state class merging      | —                                                   |

### Adopt from shadcn-svelte / Bits UI

| Component   | Source        | Install command                                    | Purpose                                           |
| ----------- | ------------- | -------------------------------------------------- | ------------------------------------------------- |
| `Accordion` | shadcn-svelte | `pnpm dlx shadcn-svelte@latest add accordion`      | Collapsible Critical/Important/Normal tier groups |
| `Progress`  | shadcn-svelte | `pnpm dlx shadcn-svelte@latest add progress`       | Footer progress bar + per-tier mini progress      |

### Build Custom

| Proposed Name        | Description                                                                                                          | Why existing components don't cover it                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `AvatarUpload`       | 72px square upload target with hover overlay, supports image preview + click-to-pick + drag-drop image file          | No upload-area primitive exists; combines drop, preview, and Tauri file dialog                    |
| `SoundChip`          | Pill with `chip-play` (primary circle), tiny waveform decoration, mono filename, duration, remove `×`                | Bespoke pattern; not a generic Badge                                                              |
| `SoundPoolItem`      | Sidebar list row: drag handle + filename + meta (duration + assigned-event tag) + circular play button (filled when playing) | Compound display + drag source; not a generic ListItem                                            |
| `EventSlotCard`      | Event card with state classes (`is-critical-empty`, `is-important-empty`, `drop-target`), header (name + id chip + count), description, sounds-list, drop zones. Sized for grid use (`min-width: 0`, internal `flex column`) | Domain-specific; encodes the tier-state colouring rules                                            |
| `TierSection`        | Collapsible wrapper around `Accordion` (borderless — no own background or border), tier-marker color, numeric-only progress + missing-count, has-missing text-colour rule, hosts a CSS-grid event list (`auto-fill / minmax(340px, 1fr)`) | Adds tier-specific visual semantics + responsive grid layout on top of plain Accordion             |
| `LanguageSelect`     | Select-with-flag (`🇨🇿 Czech`, `🇺🇸 English`…) reusing `Select`. Custom rendering of trigger and items                | Plain `Select` doesn't display a leading icon/emoji                                               |
| `PoolDropZone`       | Big dashed import-or-drop area; both click-to-pick (Tauri folder dialog) and HTML5 drop targets                      | Reused only here, but covers two interaction modes                                                |

## Implementation Notes

- **Drag-and-drop**: native HTML5 (`draggable="true"`, `dragover`, `drop`) — no library. Source = `SoundPoolItem`, target = each event card's drop zones (primary + secondary). Set `dataTransfer.setData('application/x-grovekeeper-sound', soundId)`. On `dragover`, toggle `drop-target` class on the hovered card. **One sound can attach to multiple events** (data model: `event_sound_assignments` row per pair).
- **Tier grid layout**: each `TierSection` body is `display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: space-3`. At the default split (`1fr / 340px` for events vs. sound pool) this yields 2 columns of cards on a 1280-1440px window, 3 columns on wider screens, 1 column below ~700px of available width. Cards include `min-width: 0` so the sound chip name truncates correctly inside narrow grid cells.
- **Tier section is borderless**: no own border, background, or padding tint. Tier state is communicated by the *header text colour* alone (red for critical-with-missing, orange for important-with-missing). This was the resolution to the earlier "two borders next to each other" issue (outer wrapper border + inner event-card border doubling up on tinted slots).
- **Progress display**: tier headers show numbers only (e.g. `1 / 2 assigned · 1 missing`) — no mini progress bar, since the unfilled track blended with `surface-2`. The footer's page-wide progress bar is retained but kept distinct via an explicit `1px solid var(--border)` outline; this is the single visual progress indicator on the page.
- **Multi-sound runtime semantics**: when an event fires, pick uniformly at random from the event's assigned sounds (per the random-rotation note in the brief). Persist insertion order; UI renders in that order so the user has a stable visual.
- **Tier collapse state**: persisted per-character to local store (or session-scoped in-memory if pre-MVP). Critical defaults to `open`, Normal to `closed` to keep the page short for first-load.
- **State-tint logic**: a card is `is-critical-empty` iff `tier === 'critical' && assignments.length === 0`; `is-important-empty` iff `tier === 'important' && assignments.length === 0`; never tints the Normal tier. Section header gets `has-missing` if any of its events are empty. Computed via `$derived` in Svelte 5.
- **Clear All confirmation**: required (destructive). Use `Dialog` in `alertdialog` mode; primary action `gk-btn-destructive`. Closes modal, then drops the pool list and detaches every event assignment.
- **Disabled save tooltip**: shows on hover/focus of the disabled button. List the first missing critical slot (e.g. "Assign a sound to `session.end` to enable save"). When >1 missing, summarise: "2 critical slots need a sound."
- **Language selector**: flag emojis render reliably on Windows 11 via Segoe UI Emoji and on macOS via Apple Color Emoji. The leading flag in the trigger is a separate absolutely-positioned span so the same flag is shown when the option doesn't render emoji in the closed state on some browsers.
- **Audio playback**: only one sound plays at a time (chip-level + pool-level). Toggling another stops the prior. Reflect with `is-playing` class which animates the waveform and switches the play icon to pause.
- **Keyboard navigation**: tier headers are real `<button>`s (Tab-stop, Enter/Space toggles); event cards focus-ring on Tab; drop zones respond to keyboard via "Add sound…" overflow menu (focus → Enter opens a sound-picker popover) — no keyboard-only path through native drag.
- **Accessibility**: dialog uses `role="alertdialog"` with labelled title/desc; tier toggles set `aria-expanded`; remove buttons have `aria-label="Remove sound"`; assigned-to dot is decorative, the badge text is the label.
- **Edge cases**:
    - 0 sounds in pool → big drop zone is the entire visual; sound list shows an inline "Import sounds from a folder" empty state.
    - Same sound dragged twice onto the same event → ignore (toast: "Already assigned").
    - >5 sounds on one event → vertical stack scales naturally; no wrap needed.
    - Avatar upload with file >2 MB → reject + toast.
- **Container Context**: this is a full-page Settings detail view; the global app sidebar (56px on the left) remains visible. The mockup shows it at reduced opacity per the design brief's Container Context guidance.

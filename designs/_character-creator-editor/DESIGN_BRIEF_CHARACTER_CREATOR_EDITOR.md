# Character Creator/Editor — Design Brief

> **Status**: Refined (Variant D)
> **Refined mockup**: `designs/character-creator-editor/refined.html`
> **Summary**: `designs/character-creator-editor/SUMMARY.md`
> **Refinements**: D-style header + critical-empty badge, A-style sound pool structure on the right with D-style chip visuals, multi-sound per event (vertical stack + secondary drop zone), event cards lose timeline spine and gain state-tinted borders/backgrounds (red/orange), collapsible tier sections (borderless — only event cards carry chrome) with numeric-only progress + missing-count in the header, **events laid out in a responsive grid (`auto-fill, minmax(340px, 1fr)`)** so cards in the same tier sit side-by-side instead of full-width, language selector with flag emojis replaces "X / Y assigned", Clear-All gets confirmation dialog and sits adjacent to the sound list, footer combines icon-save with outlined progress bar + disabled-save tooltip.

Full-page view for creating and editing character sound packs. User imports sound files into a pool, then drag-drops them onto notification event slots grouped by importance tier. Includes avatar upload, inline sound preview, and validation gating. Entry point: Settings → Notifications & Characters → "Create Character" button. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono. Importance tier colors: `--status-danger` (critical), `--status-warning` (important), `text-foreground-muted` (normal).

## Container Context

**Parent**: None — full-page view accessed from Settings → Notifications & Characters
**This component is standalone** — it owns its full page chrome.

## Purpose

The character creator is the primary way users build custom notification character packs. A character maps sound files to Grovekeeper's 15 notification events (grouped into critical/important/normal tiers). Users import WAV/MP3/OGG files, preview them, and assign each to exactly one event slot. Critical events must be filled before the character can be activated.

## Required Elements

### Page Header

- **Back button**: Arrow-left icon + "Back to Settings" text link (navigates to Settings → Notifications & Characters)
- **Title**: "Create Character" or "Edit {name}" depending on mode
- **Save button**: `.gk-btn-primary` — disabled until validation passes
- **Cancel button**: `.gk-btn-secondary` — confirms discard if unsaved changes

### Character Identity Section

- **Avatar upload area**: 72px rounded square, click to open file picker **or** drop an image file onto it (PNG/JPG/WebP). Hover shows a darkened overlay with the **upload (arrow-into-tray) icon**, not a camera icon. Shows current avatar or a silhouette placeholder over a warm-bark gradient.
- **Character name input**: `.gk-input` with validation (required, unique across packs). Placeholder: "e.g. Footman, Orc Peon"
- **Language selector**: Sits next to the name field on the identity strip (replaces any "X / Y assigned" meta from earlier exploration). `Select` showing **flag emoji + label** for every option (🇨🇿 Czech, 🇺🇸 English, 🇪🇸 Spanish, 🇩🇪 German, 🇫🇷 French, plus a "— None" entry). The trigger renders the selected flag at the leading edge, so the closed control is unambiguous.

### Sound Pool Panel

- **Import button**: `.gk-btn-secondary` with folder icon — "Import Sounds" — opens native folder picker, imports all WAV/MP3/OGG files from selected folder
- **Pool header**: "Sound Pool" title + "{N} files" counter on the right.
- **Clear All**: positioned at the **bottom of the sidebar adjacent to the list** (not in the header). Uses `gk-btn-danger gk-btn-sm`. Clicking opens a **confirmation `Dialog`** ("Clear all sounds?" with explanatory body + Cancel / destructive Clear All buttons) — destructive action requires confirmation.
- **Sound list**: Scrollable list of imported sound files, each row:
    - Drag handle (grip dots icon, `text-foreground-subtle`)
    - Filename (truncated, `gk-body`)
    - Duration (right-aligned, `gk-small font-mono text-foreground-muted`, e.g. "1.2s")
    - Play button (`.gk-btn-icon` ghost, speaker icon → animated while playing)
    - Status indicator: unassigned (default), assigned (green dot + target event name as `.gk-badge-success gk-tiny`)
- **Search/filter**: `.gk-input` with search icon for filtering by filename
- **Empty state**: Dashed border area with folder icon + "Import sounds from a folder" text

### Event Assignment Panel

Events grouped into three visual tiers. Each tier is a **collapsible section** (Accordion) with:

- A tier marker dot (color matches the tier).
- Tier label.
- A header-right area showing **numeric-only** progress: `N / M assigned` and a `· K missing` suffix when relevant. **No mini progress bar** — numbers carry the load (the bar's unfilled portion blended with the surface and added visual noise).
- **Tier-state colour** is carried by the header text (label + numbers turn red/orange when missing), not by a tinted background or border. The section itself is **borderless and background-less** so the only chrome on the page is the event cards themselves — this avoids the double-border seen when a tinted tier wrapper enclosed already-tinted event cards.
- **Events in a tier are laid out in a responsive grid**: `display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--space-3)`. Cards sit side-by-side when there is horizontal room (typically 2 columns at the default split, more when the sound pool is collapsed) and stack to one column below ~700px of available width. Min card width is 340px, max is governed by the grid (1fr per cell).

Default open-state on first load: Critical = open, Important = open, Normal = closed.

Each tier:

**Critical Events** (must be filled)

- Section header: `.gk-eyebrow` with `text-status-danger` color + filled circle indicator
- Background: subtle `bg-status-danger/5` tint on the section
- Events: `session.needs-input`, `session.end`

**Important Events**

- Section header: `.gk-eyebrow` with `text-status-warning` color
- Events: `session.error`, `task.error`, `merge.conflict`, `resource.limit`, `pr.ready`, `pr.review-requested`

**Normal Events**

- Section header: `.gk-eyebrow` with `text-foreground-muted` color
- Events: `session.start`, `task.complete`, `task.acknowledge`, `pr.merged`, `branch.behind-base`, `github.issue-assigned`, `github.trigger-received`, `achievement.unlocked`

**Each event slot**:

- Event name (`.gk-body font-semibold`) inline with the internal id chip (`.font-mono` on `surface-2` background, e.g. `session.needs-input`) and a one-line description (`.gk-small text-foreground-muted`).
- A header-right `event-count` line: `0 sounds · required` (critical empty), `0 sounds` (important empty), or `N sound(s)` when assigned.
- **Multi-sound per event (first-class)**: an event may hold 0 to N sounds. When ≥ 1 sound is assigned, sounds stack vertically inside the card as `SoundChip`s (filename + waveform + primary play button + remove ×); a compact secondary "Drop another sound (random rotation)" zone appears beneath the stack so adding another sound is always one drag away. When the event fires at runtime, one of the assigned sounds is picked uniformly at random.
- When the event is empty, a single primary drop zone fills the body ("Drop a sound here" — or "Drop a sound here — required" for critical).
- **State-tinted card** (border + background tint):
    - Critical event with 0 sounds → border `color-mix(status-danger 45% / border)`, bg tint `status-danger 5%`.
    - Important event with 0 sounds → border `color-mix(status-warning 40% / border)`, bg tint `status-warning 4%`.
    - Otherwise default surface.
- Drop-target state on drag-over: `border-primary bg-primary/5` + outer `box-shadow: 0 0 0 3px primary/15`.

### Validation Footer

- **Validation summary**: inline at bottom, shows missing requirements
    - "2 critical events need sounds" — `text-status-danger`
    - "Ready to save" — `text-status-success` with check icon
- **Progress bar + count**: `progress` bar (140px) + `N / 15 events` mono-numeric label. Bar has an explicit `1px solid var(--border)` outline so the unfilled portion remains visible against the page surface (the tier-level mini progress bars were removed for this reason; the footer one is kept as the single page-wide indicator). Fill color gradient `moss-400 → status-warning` while any non-critical events remain unfilled, solid `moss-400` once all are assigned.
- **Save**: `.gk-btn-primary` with save (disk) icon, disabled until all critical slots are filled. **Hover/focus the disabled save** → tooltip naming the missing slot (e.g. "Assign a sound to `session.end` to enable save"; if multiple, summarise: "2 critical slots need a sound").
- **Cancel**: `.gk-btn-ghost`.
- The header-right also shows a redundant `gk-badge-danger` "N critical slot(s) empty" badge when any critical event is unfilled, so the state is visible without scrolling to the footer.

## States

List every state that must be designed:

- **Empty state**: No sounds imported, no character name, all event slots empty
- **Mid-assignment**: Some sounds in pool, some assigned to events, at least one critical event empty
- **Multi-sound event**: A single event holds 2+ sounds; each rendered as a `SoundChip` stacked vertically with a secondary "Drop another sound" zone at the end
- **Drag in progress**: Sound being dragged from pool over an event slot (show drop zone highlight)
- **Drag-over accept**: Drop zone with `border-primary bg-primary/5` when valid drop target
- **Complete & valid**: All critical events filled, name provided, save button enabled
- **Edit mode**: Pre-populated with existing character data, all fields editable
- **Sound playing**: Animated speaker icon on the currently playing sound
- **File import in progress**: Loading spinner in sound pool during folder import
- **Validation error**: Name input with error styling (duplicate character name)
- **Unsaved changes**: Confirmation dialog shown on cancel/back when changes exist
- **Avatar hover**: Upload area hover state with camera/upload icon overlay
- **Avatar uploading**: Loading indicator during avatar file upload
- **Event slot overflow**: Event with 5+ assigned sounds (scroll or wrap behavior)
- **Save disabled**: Save button disabled with tooltip explaining missing requirements
- **Empty critical slot**: Warning border styling on unfilled critical event slots
- **Empty important slot**: Orange-tinted card border + background on unfilled important slots
- **Tier collapsed / expanded**: Clicking a tier header toggles its body (Accordion); state persists per character
- **Tier with missing slots**: Tier header + body get `has-missing` tinting (red for critical, orange for important)
- **Clear All confirmation**: Modal Dialog asking the user to confirm clearing every imported sound

## Reusable Components

- `Button`: primary for save, secondary for import, ghost for cancel, danger for Clear All, destructive for confirm in Dialog, `icon-sm` for play/remove
- `Card.Card`: event-card surface
- `Badge`: header "N critical slot(s) empty", assigned-event indicators on sound items
- `Input`: character name, search filter
- `Select`: language selector (with flag emoji rendering)
- `Dialog`: Clear-All confirmation (alertdialog mode)
- `Tooltip`: disabled save button explanation, event descriptions
- `Separator`: header divider, footer area
- `cn()`: drag-over state classes, tier-state and card-state coloring

## Components to Adopt

- `Accordion` from shadcn-svelte for collapsible event tier groups (bits-ui primitive) — `pnpm dlx shadcn-svelte@latest add accordion`
- `Progress` from shadcn-svelte for footer progress bar + per-tier mini progress — `pnpm dlx shadcn-svelte@latest add progress`
- Native HTML5 drag-and-drop API (no library needed for this scale)
- Tauri folder picker (`@tauri-apps/plugin-dialog`) for "Import Sounds" folder selection

## Layout Constraints

- Full page width with `p-6` padding
- Header: sticky top, `h-14`, `border-b border-border`
- Two-panel split (refined): events on the **left** (main), sound pool on the **right** (`grid-template-columns: 1fr 340px`) — keeps the pool aligned with the app's left sidebar, mirroring the rest of the app shell.
- Sound pool: `flex column`, `min-height: 0` and `overflow-y-auto` on the inner sound list only.
- Event panel: scrolls vertically; sticky header + sticky footer remain visible.
- Sound item height: 36px (compact rows)
- Event slot min-height: 48px (comfortable drop target)
- Avatar: 96px upload area, stored as 128x128 WebP

## Visual References

- IssueCard: `src/lib/components/IssueCard.svelte` (card density, avatar placement)
- NotificationSettingsPanel: `src/lib/components/NotificationSettingsPanel.svelte` (event tier grouping pattern)
- Creation Wizard mockup: `claude_design/Creation Wizard.html` (multi-step flow reference)
- Current settings layout: `src/routes/settings/+page.svelte`

## UI Freedom

- Sound pool and event panel proportions (defaulted to `1fr / 340px`)
- Drag ghost appearance and drop zone animation
- Whether the search/filter in sound pool is always visible or appears on focus

Decided during refinement (no longer free):

- Tiers are collapsible accordions (Critical/Important open by default, Normal closed).
- Sound chips: D-style pill with primary-circle play button, mini waveform, mono filename, duration, remove ×.
- Avatar upload: click **or** drag-drop image file.
- Multi-sound layout: vertical stack inside the card; secondary "Drop another sound" zone beneath the stack (no horizontal wrapping).

## Not Included

- Bulk Import Wizard (separate brief: BULK_IMPORT_WIZARD.md)
- Pack download/install from peon-ping registry (separate feature)
- Character list view in settings (simple list, doesn't need a brief)
- Sound file format conversion (handled in Rust backend)
- IssueCard avatar display and right-click character override

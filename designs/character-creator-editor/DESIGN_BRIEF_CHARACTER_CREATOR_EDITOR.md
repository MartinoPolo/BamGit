# Character Creator/Editor — Design Brief

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

- **Avatar upload area**: 96px rounded square, click to open file picker (PNG/JPG/WebP), hover overlay with camera/upload icon. Shows current avatar or placeholder silhouette.
- **Character name input**: `.gk-input` with validation (required, unique across packs). Placeholder: "e.g. Footman, Orc Peon"
- **Language selector**: Optional dropdown — None, then flag+label options (🇨🇿 Czech, 🇺🇸 English, 🇪🇸 Spanish, etc.). Only shown if relevant.

### Sound Pool Panel

- **Import button**: `.gk-btn-secondary` with folder icon — "Import Sounds" — opens native folder picker, imports all WAV/MP3/OGG files from selected folder
- **Pool header**: "{N} sounds imported" counter + "Clear All" ghost button
- **Sound list**: Scrollable list of imported sound files, each row:
    - Drag handle (grip dots icon, `text-foreground-subtle`)
    - Filename (truncated, `gk-body`)
    - Duration (right-aligned, `gk-small font-mono text-foreground-muted`, e.g. "1.2s")
    - Play button (`.gk-btn-icon` ghost, speaker icon → animated while playing)
    - Status indicator: unassigned (default), assigned (green dot + target event name as `.gk-badge-success gk-tiny`)
- **Search/filter**: `.gk-input` with search icon for filtering by filename
- **Empty state**: Dashed border area with folder icon + "Import sounds from a folder" text

### Event Assignment Panel

Events grouped into three visual tiers, each with a header:

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

- Event name (`.gk-body font-semibold`) + one-line description (`.gk-small text-foreground-muted`)
- Drop zone: dashed border area, highlights on drag-over (`border-primary bg-primary/5`)
- When sound assigned: shows sound chip (filename + play button + remove X button)
- Multiple sounds per event allowed (for random rotation)
- Empty critical slots show warning styling: `border-status-danger/30` dashed border

### Validation Footer

- **Validation summary**: inline at bottom, shows missing requirements
    - "2 critical events need sounds" — `text-status-danger`
    - "Ready to save" — `text-status-success` with check icon
- **Save**: `.gk-btn-primary`, disabled with tooltip when validation fails
- **Cancel**: `.gk-btn-ghost`

## States

List every state that must be designed:

- **Empty state**: No sounds imported, no character name, all event slots empty
- **Mid-assignment**: Some sounds in pool, some assigned to events, at least one critical event empty
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

## Reusable Components

- `Button`: primary for save, secondary for import, ghost for cancel/clear, `icon-sm` for play/remove
- `Card.Card`: wrapping the sound pool and event panels
- `Badge`: event tier labels, assigned-event indicators on sound items
- `Input`: character name, search filter
- `SimpleTooltip`: disabled save button explanation, event descriptions
- `Separator`: between tier groups
- `cn()`: drag-over state classes, tier-specific coloring

## Components to Adopt

- Consider `Accordion` from shadcn-svelte for collapsible event tier groups (bits-ui primitive)
- Native HTML5 drag-and-drop API (no library needed for this scale)
- `<input type="file" webkitdirectory>` via Tauri file dialog for folder import

## Layout Constraints

- Full page width with `p-6` padding
- Header: sticky top, `h-14`, `border-b border-border`
- Two-panel split: `grid-cols-[minmax(280px,_1fr)_2fr] gap-6`
- Sound pool: `max-h-[calc(100vh-8rem)] overflow-y-auto`
- Event panel: `max-h-[calc(100vh-8rem)] overflow-y-auto`
- Sound item height: 36px (compact rows)
- Event slot min-height: 48px (comfortable drop target)
- Avatar: 96px upload area, stored as 128x128 WebP

## Visual References

- IssueCard: `src/lib/components/IssueCard.svelte` (card density, avatar placement)
- NotificationSettingsPanel: `src/lib/components/NotificationSettingsPanel.svelte` (event tier grouping pattern)
- Creation Wizard mockup: `claude_design/Creation Wizard.html` (multi-step flow reference)
- Current settings layout: `src/routes/settings/+page.svelte`

## UI Freedom

- Sound pool and event panel proportions
- Whether event tiers are collapsible accordions or always-visible sections
- Sound chip visual treatment (pill, tag, mini-card)
- Drag ghost appearance and drop zone animation
- Avatar upload interaction (click-only vs drag-drop image)
- Whether the search/filter in sound pool is always visible or appears on focus
- How to handle many sounds per event (horizontal scroll, wrap, or collapse)

## Not Included

- Bulk Import Wizard (separate brief: BULK_IMPORT_WIZARD.md)
- Pack download/install from peon-ping registry (separate feature)
- Character list view in settings (simple list, doesn't need a brief)
- Sound file format conversion (handled in Rust backend)
- IssueCard avatar display and right-click character override

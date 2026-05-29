# Process Log Viewer & MonospaceBlock — Design Brief

> **Status**: Refined (Variant A)
> **Refined mockup**: `designs/process-log-viewer/refined.html`
> **Summary**: `designs/process-log-viewer/SUMMARY.md`
> **Refinements**: fixed scroll indicators, scroll-to-top button, single copy button (footer only), port badge in header, proper Button/Dialog component styling

A near-fullscreen dialog for viewing streaming process output (stdout/stderr) with auto-scroll, copy, and full-log loading. Plus a shared MonospaceBlock component extracted from repeated inline `<pre>` patterns.

**Source**: PRD #339, sub-issue #342
**Gold standard reference**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`

---

## 1. Purpose

When a dev server crashes or tests fail, developers need to read the output. Today that means switching to a terminal. ProcessLogViewer puts streaming logs front-and-center in a dialog, with stderr coloring to spot errors at a glance. The "Load full log" feature ensures nothing is lost even when the in-memory buffer (1000 lines) rolls over.

MonospaceBlock extracts a repeated pattern (monospace pre block with optional copy and max-height) into a shared component, replacing 4+ inline implementations.

**Key value**: Read live process output without leaving Grovekeeper; spot errors instantly via stderr coloring.

---

## 2. Surrounding Context

### ProcessLogViewer — Dialog Overlay

The log viewer is a **Dialog** floating above everything. It appears when the user clicks "View Logs" from a context menu (issue card Commands submenu or ServerPortBadge right-click).

**Viewport**: Full window, 1440×900 representative proportions
**Backdrop**: Semi-transparent overlay (`color-mix(in oklch, oklch(0.1 0.02 150) 50%, transparent)`) — no blur per DECISIONS.md
**Dialog position**: Centered in viewport
**Dialog dimensions**: ~85% viewport height, ~27:20 aspect ratio (height:width). At 900px viewport height → ~765px dialog height → ~567px dialog width. On wider screens, width can expand but maintains proportional feel.

**What parent provides**: The Dialog overlay, backdrop, and close-on-Escape behavior
**What this component fills**: Dialog content area (header bar + scrollable log body + optional footer)
**Must NOT include**: The context menu that triggers it — that's #341's scope

**Mockup rendering instructions**:
- Show the dialog at center of a darkened viewport
- Behind the backdrop: hint of the dashboard (blurred/darkened cards visible)
- Dialog is the clear visual focus
- Show log content with mixed stdout and stderr lines
- Show auto-scroll indicator and toolbar buttons

### MonospaceBlock — Inline Component

Used inline within other components. No surrounding context to design — it's a self-contained block.

**Mockup rendering instructions**:
- Show MonospaceBlock in 3 sizes: small (3 lines), medium (10 lines with scroll), large (max-height clipped)
- Show with and without copy button
- Dark theme surface

---

## 3. Requirements

### 3.1 ProcessLogViewer Dialog — Layout

```
┌──────────────────────────────────────────────┐
│ ■ [CommandName] — [IssueIdentifier]    [⿻] [✕] │  ← Title bar
├──────────────────────────────────────────────┤
│                                              │
│ stdout line 1                                │
│ stdout line 2                                │
│ stderr line 3 (red/orange)                   │  ← Scrollable log body
│ stdout line 4                                │
│ ...                                          │
│ stdout line N                                │
│                                              │
├──────────────────────────────────────────────┤
│ [Load full log]           [Copy] [Auto-scroll ↓] │  ← Footer toolbar
└──────────────────────────────────────────────┘
```

**Title bar**:
- Left: status dot (colored by process state) + command name + em dash + issue identifier + port badge (if server)
- Format: `● dev-server — #42 fix-auth-bug [:1420]` (dot in process state color, command in regular weight, issue in muted, port badge uses existing ServerPortBadge component)
- Port badge: shown only when the process has detected ports (dev-server commands). Reuses `ServerPortBadge` with `:port` format.
- Right: Close button only (icon-only, `X`, ghost variant, `size="icon-sm"`)
- No copy button in title bar — single copy button lives in the footer toolbar

**Log body**:
- Full width, vertically scrollable
- Monospace font: `font-mono text-[11.5px]` (matches existing code display in the app)
- Background: `bg-surface-2` (dark code background)
- Line padding: `px-3 py-0.5` per line
- Stdout lines: `text-foreground` (light gray/white)
- Stderr lines: `text-status-danger` or a warm orange-red tone — clearly distinct from stdout but still readable
- Line wrapping: `whitespace-pre-wrap` (wrap long lines, preserve formatting)
- Optional: line numbers in gutter (subtle, `text-foreground-subtle`, right-aligned, fixed-width)

**Footer toolbar**:
- Left: "Load full log" button (appears only when viewing the 1000-line tail cache, not when full log is loaded) + line count (`1,000 / 2,847 lines`)
- Right: Copy button (secondary variant, copies all log content) + Auto-scroll toggle (toggle button with `aria-pressed`, primary tint when active)
- All buttons use `Button` component with `size="sm"` and `intent="secondary"` (visible border). Auto-scroll uses toggle styling (primary tint bg + border when on).

### 3.2 ProcessLogViewer — Streaming Behavior

- **Auto-scroll**: Enabled by default (toggle in footer). New lines automatically scroll the view to the bottom.
- **Scroll pause**: When user scrolls up manually, auto-scroll toggle turns off. A floating pill appears at the bottom of the log area showing "+N lines ↓".
- **Resume**: Auto-scroll resumes when user clicks the bottom pill, clicks the auto-scroll toggle, or scrolls back to the bottom manually.
- **Scroll indicators**: Two floating pills overlaid on the log body wrapper (positioned **outside** the scroll container so they don't scroll with content):
  - **Bottom pill**: "+N lines ↓" — visible when not scrolled to bottom. Click jumps to bottom and resumes auto-scroll.
  - **Top pill**: "↑ Scroll to top" — visible when not scrolled to top. Click jumps to top.
  - Both hide when the scroll position reaches their respective edge. Both visible when scrolled to the middle.
  - Positioned via `position: absolute` on a wrapper div, not inside the scrollable area.

### 3.3 ProcessLogViewer — Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Copy** | Click copy button in footer toolbar | Copies entire visible log content to clipboard. Shows checkmark feedback for 2s (same pattern as CodeBlock.svelte). Single copy button — no duplicate in title bar. |
| **Load full log** | Click "Load full log" button | Calls `get_full_process_logs` Tauri command. Replaces tail cache with full content. Button disappears after loading. Loading state shows spinner. |
| **Close** | Click X button, press Escape | Closes dialog. Stops listening to process events for this viewer (process continues running). |
| **Auto-scroll toggle** | Click toggle button in footer | Toggles auto-scroll on/off. Icon reflects current state. |

### 3.4 ProcessLogViewer — Resize

- Dialog is potentially resizable via drag handles on edges/corners
- Minimum size: 400×300px
- Maximum size: 95vw × 95vh
- Resize is **design freedom** — the designer decides if drag-resize adds enough value or if the fixed ~85vh proportions are sufficient

### 3.5 ProcessLogViewer — Process States in Dialog

The dialog title bar status dot reflects the current process state:

| Process State | Dot Color | Additional UI |
|---------------|-----------|---------------|
| Running | `--status-info` (blue), spinning | Lines streaming in real-time |
| Passed | `--status-success` (green) | "Process exited (0)" final line |
| Failed | `--status-danger` (red) | "Process exited (N)" final line in red |
| Timeout | `--status-warning` (amber) | "Process timed out" final line in amber |
| Stopped | `--foreground-subtle` (gray) | "Process killed" final line in gray |

### 3.6 MonospaceBlock Component

A shared component replacing inline `<pre class="whitespace-pre-wrap font-mono text-xs ...">` patterns found in:
- `ToolCardPermission.svelte`
- `ToolCardExpanded.svelte`
- `NoteCard.svelte`
- `AssistantMessage.svelte` (code-like sections)

**Props**:
- `content: string` — the text to display
- `maxHeight?: string` — optional CSS max-height (e.g., `'200px'`), enables scrolling
- `copyButton?: boolean` — whether to show a copy button (default: false)
- `class?: string` — additional CSS classes

**Visual treatment**:
- Background: `bg-surface-2`
- Border: `border border-border rounded-md`
- Padding: `p-3`
- Font: `font-mono text-[11.5px] leading-relaxed`
- Text: `text-foreground`
- `whitespace-pre-wrap` (wrap long lines)
- When `maxHeight` set: `overflow-y-auto` with scrollbar styling
- Copy button: positioned top-right, ghost style, appears on hover of the block

**NOT the same as ProcessLogViewer**: MonospaceBlock is static content with optional copy. ProcessLogViewer is a streaming dialog with auto-scroll, stderr coloring, and process lifecycle. They share visual tokens (font, background) but are distinct components.

---

## 4. States

### ProcessLogViewer Dialog States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| **Streaming** | Status dot spinning, lines appearing, auto-scroll active | Process running |
| **Paused scroll** | "New output below" indicator, auto-scroll button highlighted | User scrolled up |
| **Process completed** | Status dot solid (green/red/amber/gray), final exit line shown | Process exited |
| **Loading full log** | Spinner on "Load full log" button, log body shows loading skeleton | User clicked Load |
| **Full log loaded** | "Load full log" button gone, complete log shown | Full log fetched |
| **Empty** | Centered message: "Waiting for output..." with muted text | Process just started, no output yet |
| **Error loading** | Toast notification for failed log fetch | Tauri command error |

### MonospaceBlock States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| **Default** | Static content, copy button hidden | Resting |
| **Hover** | Copy button appears (top-right, ghost) | Mouse enters block |
| **Copied** | Copy icon → Check icon for 2s | User clicked copy |
| **Scrollable** | Scroll indicator / scrollbar visible | Content exceeds maxHeight |
| **Empty** | Empty block with min-height | Content is empty string |

---

## 5. Component Reuse Map

### Existing Components (MUST use)

| Component | Variant/Props | Usage in This Design |
|-----------|--------------|---------------------|
| `Dialog.Root/Content/Header/Title/Close` | From `$lib/components/shadcn/dialog` | Log viewer container |
| `Dialog.Overlay` | Semi-transparent backdrop | Behind dialog |
| `Button` | `variant="ghost" size="icon-sm"` | Copy, close, auto-scroll buttons |
| `Spinner` | Default | Loading indicator in "Load full log" |
| Lucide `CopyIcon` | `@lucide/svelte/icons/copy` | Copy button icon |
| Lucide `CheckIcon` | `@lucide/svelte/icons/check` | Copy success feedback |
| Lucide `XIcon` | `@lucide/svelte/icons/x` | Close button |
| Lucide `ArrowDownIcon` | `@lucide/svelte/icons/arrow-down` | Auto-scroll indicator |
| `CodeBlock.svelte` | Reference only | Copy button pattern (navigator.clipboard + 2s feedback) |

### Components to Create

| Component | Description | Why New |
|-----------|-------------|---------|
| **ProcessLogViewer** | Streaming log dialog with auto-scroll, stderr coloring, copy, load-full | Unique streaming behavior, process lifecycle awareness, line-level styling — not a generic dialog |
| **MonospaceBlock** | Static monospace content block with optional copy and max-height | Replaces 4+ inline `<pre>` patterns. Simpler than ProcessLogViewer — no streaming, no scroll management |

### Components NOT to Create

- No `LogLine` component — individual line styling is CSS-only (class toggle for stderr vs stdout)
- No `AutoScrollManager` — scroll behavior lives inside ProcessLogViewer as internal logic

---

## 6. Layout Constraints

### ProcessLogViewer
- Dialog height: ~85vh (~765px at 900px viewport)
- Dialog width: aspect ratio ~27:20 → ~567px base, responsive up to ~800px on wider screens
- Min dimensions: 400×300px (if resizable)
- Max dimensions: 95vw × 95vh
- Title bar height: ~40px
- Footer toolbar height: ~36px
- Log body: remaining height, scrollable
- Line height: `leading-relaxed` (1.55) at 11.5px → ~17.8px per line
- Visible lines: ~(765 - 40 - 36) / 17.8 ≈ **38 lines** visible at default size

### MonospaceBlock
- Width: 100% of parent container
- Default height: auto (content-sized)
- With maxHeight: clips and scrolls
- Padding: 12px (`p-3`)
- Border-radius: `rounded-md` (8px)
- Copy button: absolute positioned top-right, 8px inset from block edges

---

## 7. Design Tokens

### ProcessLogViewer

| Token | Usage |
|-------|-------|
| `--surface-2` | Log body background |
| `--surface` | Dialog background, footer background |
| `--border` | Dialog border, footer separator |
| `--foreground` | Stdout text |
| `--status-danger` or custom stderr color | Stderr text — must be clearly distinct from stdout but not blinding red |
| `--foreground-subtle` | Line numbers, muted metadata |
| `--foreground-muted` | Issue identifier in title, empty state text |
| `--font-mono` 11.5px | All log content |
| `--font-sans` 13px | Title bar, button labels |
| `--radius-xl` (14px) | Dialog border-radius |
| `--shadow-lg` | Dialog shadow |
| `--status-success/danger/warning/info` | Status dot colors per process state |

### MonospaceBlock

| Token | Usage |
|-------|-------|
| `--surface-2` | Block background |
| `--border` | Block border |
| `--foreground` | Content text |
| `--font-mono` 11.5px | Content font |
| `--radius-md` (8px) | Block border-radius |

---

## 8. Design Constraints (Non-Negotiable)

- **Dialog, not Sheet**: Log viewer uses Dialog (centered, focused) not Sheet (side drawer). DECISIONS.md: "Dialog is front-and-center for focused log reading."
- **No backdrop blur**: per DECISIONS.md. Opacity-only overlay.
- **Stderr must be visually distinct**: Different color from stdout. Not just bold — color difference required.
- **Auto-scroll default**: Must scroll to bottom automatically. Users opt out by scrolling up.
- **Copy pattern**: Uses `navigator.clipboard.writeText()` with 2s check icon feedback (matches CodeBlock.svelte).
- **In-memory tail + disk full**: 1000-line tail cache displayed by default. "Load full log" fetches from temp file on disk.
- **Title format**: `● commandName — #issueNumber slug` (status dot + command + issue context)
- **Close on Escape**: Standard dialog behavior, must work.
- **Monospace font**: `font-mono text-[11.5px]` for all log content — matches existing code display.
- **MonospaceBlock is NOT ProcessLogViewer**: They share visual tokens but are separate components with different concerns.
- **Lucide icons only**: Path imports from `@lucide/svelte/icons/*`.

---

## 9. Design Freedom

- **Stderr color**: Could be `--status-danger` (red), or a warmer orange-red, or a softer rose. Must be distinct from stdout but not eye-straining for long error logs. Consider `oklch(0.72 0.135 15)` (rose-400) as an alternative to full danger red.
- **Line numbers**: Optional. Could add a gutter with subtle line numbers or omit for cleaner look.
- **Resize behavior**: Could be fixed-size dialog or resizable via drag handles. Fixed is simpler; resizable accommodates different log verbosity.
- **New output indicator style**: When auto-scroll paused — could be a floating pill at bottom of log body, a subtle bar, or a count badge on the auto-scroll button.
- **Status dot animation**: Running dot could pulse, spin, or have a subtle glow — designer's choice.
- **Footer layout**: Could be a distinct toolbar bar or integrated into the dialog content area.
- **MonospaceBlock copy button**: Could be always-visible or hover-revealed. Could be inside the block or on the border edge.
- **Dialog width**: ~27:20 ratio is a guideline. Designer can adjust proportions if it reads better wider or narrower.
- **Transition**: Dialog entry/exit animation (fade, scale, slide — bits-ui defaults or custom).

---

## 10. Visual References

- **Internal**: `src/lib/components/blocks/chat/CodeBlock.svelte` (66 lines) — copy button with CheckIcon/CopyIcon toggle, language badge. Reference for copy UX pattern.
- **Internal**: `src/lib/components/shadcn/dialog/` — bits-ui dialog primitives. 11 subcomponents (Root, Content, Header, Body, Footer, Title, etc.).
- **Internal**: `src/lib/components/blocks/chat/ToolCardExpanded.svelte` — inline monospace pre pattern to be replaced by MonospaceBlock.
- **Internal**: `src/lib/components/blocks/chat/ToolCardPermission.svelte` — another inline pre pattern.
- **Issue card v2**: `designs/issue-card-v2/variants/variant-g.html` — overall app aesthetic, color palette, density.
- **Design tokens**: `designs/tokens.css` — Forest Moss palette, surface colors, typography scale.
- **DECISIONS.md**: "Log viewer as near-fullscreen dialog" (2026-05-18), "No backdrop blur on overlays" (2026-05-10).

---

## 11. Not Included (Scope Exclusions)

- **Context menus that trigger the log viewer** — covered by #341
- **Badge visual states** — covered by #340
- **Process context module** — backend/state architecture, not visual
- **Command test button** — #344 reuses ProcessLogViewer in one-shot mode but that's #344's scope
- **Embedded terminal (xterm.js)** — explicitly out of PRD #339 scope, future PRD #346
- **Log persistence to database** — logs are transient, temp files only
- **Future panelization** — DECISIONS.md mentions logs may move to a dashboard panel; this brief designs the dialog version only

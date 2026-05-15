# Group E: Notifications Follow-up, AI Configuration PRD #94

Extracted from sessions: 2026-05-08 to 2026-05-10. Source sessions:

- `5067fabb` (4.9MB, 2026-05-08) — notifications PRD #95 follow-up
- `3f91839b` (3.9MB, 2026-05-10) — AI configuration PRD #94 grilling

---

## Session 1: Notifications & Sounds Follow-up (5067fabb)

### Round 1 — Sound Engine & Settings Architecture

- **Topic**: Tokio runtime crash fix
  **Question**: Fix `PlaybackQueue` crash — lazy-init on first `notify()` call or `OnceCell` + `setup()` hook?
  **Answer**: Fix it AND add proper error handling. User got no error feedback when sounds failed — expected toast or visible error.
  **Category**: Platform

- **Topic**: Sound error handling
  **Question**: Should `test_notification_sound` be synchronous and return `Err(String)` on failure?
  **Answer**: Yes — fix full error chain: Tokio crash (lazy-init), make command synchronous, show success/error toast, add to `TAURI_ONLY_COMMANDS` for browser mock.
  **Category**: Platform

- **Topic**: Browser mode sound playback
  **Question**: Can sounds play in browser mode without Tauri?
  **Answer**: No — "Desktop app required" Mock Action Toast. Web Audio API duplication not worth it.
  **Category**: Platform

- **Topic**: MP3 support
  **Question**: Add `minimp3` rodio feature, convert MP3s to OGG at import, or ship both?
  **Answer**: Add `minimp3` feature. MIT-licensed; peon-ping packs use MP3.
  **Category**: Platform

- **Topic**: Sound rotation / last-played tracking
  **Question**: Add `HashMap<(EventType, PackId), usize>` in queue actor?
  **Answer**: Yes — implement now. ~15 lines. Was in PRD #95 requirements.
  **Category**: Platform

- **Topic**: Settings tab navigation architecture
  **Question**: Full sidebar from PRD #96 now, horizontal tab bar, or nested route?
  **Answer**: Full settings sidebar with all 9 sections, placeholder tabs for undefined sections. No significant scrolling — split if > 2x visible height.
  **Category**: UI-Design

- **Topic**: Notifications tab content
  **Question**: One "Notifications & Characters" tab or split subtabs?
  **Answer**: One tab. Subtabs optional. Split if > 2x visible height.
  **Category**: UI-Design

- **Topic**: Accordion component
  **Question**: Use accordion for notification event list? Which library?
  **Answer**: Yes — investigate shadcn-svelte / bits-ui, create Storybook stories.
  **Category**: UI-Design

- **Topic**: Sound-to-event auto-mapping
  **Question**: Auto-map by filename, import all unassigned, or auto-map as suggestion?
  **Answer**: Try automatic mapping based on the pack, defer custom per-event assignment.
  **Category**: Data-State

- **Topic**: Character assignment on issue creation
  **Question**: Auto-assign randomly?
  **Answer**: Yes — implement random assignment.
  **Category**: Data-State

- **Topic**: Language variant characters
  **Question**: Separate characters for language variants (EN/CZ)?
  **Answer**: Yes — visualized with country flag or language shortcut in parentheses.
  **Category**: UI-Design

- **Topic**: Event wiring for unfinished events
  **Question**: How to handle events we cannot wire now?
  **Answer**: Track them — note in relevant GitHub issue or PR with reminder to check notification event wiring.
  **Category**: Workflow

- **Topic**: Bundle strategy for character packs
  **Question**: Bundle all 39 packs or download-on-demand?
  **Answer**: Bundle all four initial characters (peon, peasant, GLaDOS, battlecruiser/kerrigan/peon-ping defaults). User wants full library accessible.
  **Category**: Platform

- **Topic**: Character creator pivot
  **Question**: Complete Czech WC3 voice files found (396 characters, 3028 sounds). Impact?
  **Answer**: Pivot to character creator UI for importing arbitrary sound folders.
  **Category**: Domain-Language

### Round 2 — Character Creator

- **Topic**: Sound file storage
  **Question**: Copy imported files or reference in-place?
  **Answer**: Copy — pack must be self-contained to match `discover_packs()` contract.
  **Category**: Data-State

- **Topic**: Import workflow
  **Question**: Single creator only, bulk wizard, or both?
  **Answer**: Both — single creator for ad-hoc, bulk wizard for structured folder imports.
  **Category**: UI-Design

- **Topic**: Sound-to-event assignment UX
  **Question**: Drag-and-drop, event list with file pickers, or sound list with event dropdowns?
  **Answer**: Drag-and-drop with "Add" button fallback per event slot. Critical events at top, styled prominently. Critical events must be filled or character cannot be used.
  **Category**: UI-Design

- **Topic**: Sound preview during assignment
  **Question**: Click-to-play, hover-to-play, or dedicated preview panel?
  **Answer**: Click-to-play.
  **Category**: UI-Design

- **Topic**: Avatar handling
  **Question**: Input format and storage?
  **Answer**: PNG/JPG/WebP input → store as WebP, 128×128px, fallback silhouette.
  **Category**: Data-State

- **Topic**: Bulk import auto-assignment
  **Question**: Auto-map, import unassigned, or auto-map as suggestion?
  **Answer**: Auto-map as suggestion with full manual control after. `Death` → error event. `session.end` shares sounds with `session.needs-input`.
  **Category**: UI-Design

- **Topic**: Minimum valid character pack
  **Question**: Name only? Avatar optional? At least 1 sound?
  **Answer**: Name required + critical sounds filled. Missing critical = cannot be used.
  **Category**: Domain-Language

- **Topic**: Character editing and deletion
  **Question**: Edit anytime? Delete behavior?
  **Answer**: Edit anytime. Delete offers "Delete & Reset to Default."
  **Category**: Data-State

- **Topic**: Character creator location
  **Question**: Settings entry point, separate page, or modal?
  **Answer**: Entry point in Settings → Notifications, full-page editor (not modal), back button returns to settings.
  **Category**: UI-Design

- **Topic**: Character list card design
  **Question**: What format?
  **Answer**: Card format similar to issue cards with preview avatar.
  **Category**: UI-Design

---

## Session 2: AI Configuration PRD #94 (3f91839b)

### Initial Grill Round

- **Topic**: Frontmatter parsing layer
  **Answer**: Rust with `serde_yaml`. File I/O lives in Rust; frontend stays display-only.
  **Category**: Platform

- **Topic**: Memory display grouping
  **Answer**: Grouped by type (user/feedback/project/reference); source shown as badge. MEMORY.md index file skipped.
  **Category**: UI-Design

- **Topic**: Discovery performance
  **Answer**: No cache — scan fresh on page navigate. Manual "Refresh" button. ~50 files on SSD is sub-second.
  **Category**: Platform

- **Topic**: Hook display
  **Answer**: Metadata only (filename, event type, matcher, timeout, description from JSDoc). "Open file" button for source.
  **Category**: UI-Design

- **Topic**: Navigation placement
  **Answer**: New 4th sidebar nav item with `Sparkles` icon at `/ai-config` — separate from Settings.
  **Category**: UI-Design

- **Topic**: Detail view component
  **Answer**: Initially Sheet — later revised to centered Dialog (max-w-2xl, h-[80vh]).
  **Category**: UI-Design

- **Topic**: Card layout
  **Answer**: Responsive 3/2/1 grid. Existing `Card` component. Show name, description (2 lines truncated), category badges, source badge.
  **Category**: UI-Design

- **Topic**: Markdown rendering
  **Answer**: Reuse `renderMarkdown()` from `marked` + DOMPurify already in `chat/markdown_renderer.ts`.
  **Category**: Platform

- **Topic**: File opener
  **Answer**: `@tauri-apps/plugin-opener`. "Open file" → `openPath()`, "Open folder" → `revealItemInDir()`.
  **Category**: Platform

- **Topic**: `@include` directive resolution
  **Answer**: Rust backend resolves before returning content. Each included file also shown as separate item in Instructions tab.
  **Category**: Platform

- **Topic**: Tab counts
  **Answer**: `Skills (32)` format, updates after search filtering.
  **Category**: UI-Design

- **Topic**: Discovery paths
  **Answer**: Configurable via native file browser (`pick_folder`). No hardcoded paths. Custom paths stored as JSON array in `app_settings` with user-defined labels.
  **Category**: Platform

- **Topic**: Tab ordering
  **Answer**: Skills → Agents → Hooks → MCP → Memories → Instructions.
  **Category**: UI-Design

- **Topic**: Project-level discovery
  **Answer**: Scan `{project}/.claude/commands/` and `{project}/.claude/agents/` from the start.
  **Category**: Platform

- **Topic**: MCP server discovery
  **Answer**: Provider-agnostic adapter pattern. Ship with Claude Code adapter first. Each MCP card shows provider badge.
  **Category**: Platform

### Second Grill Round (After Implementation Feedback)

- **Topic**: Provider scope for skills
  **Q1**: Claude Code-centric or investigate all providers?
  **Answer**: Investigate all providers thoroughly — skills are a standard (agentskills.io).
  **Category**: Platform

- **Topic**: Rules tab
  **Q2**: Add a 7th tab?
  **Answer**: Yes, add Rules with standard discovery strategy.
  **Category**: UI-Design

- **Topic**: Deprecated agents/reference docs
  **Q3**: Show deprecated with badge or hide?
  **Answer**: Show as deprecated and filterable.
  **Category**: UI-Design

- **Topic**: Discovery sources display
  **Q4**: Collapsible section between tab bar and content?
  **Answer**: Yes.
  **Category**: UI-Design

- **Topic**: Card vs list view
  **Q7**: Two view modes?
  **Answer**: Yes, toggled by icon buttons.
  **Category**: UI-Design

- **Topic**: Sort options
  **Q8**: Sort by Name, Source, Category — persist per tab?
  **Answer**: Yes.
  **Category**: UI-Design

- **Topic**: Cross-tab search
  **Q10**: Active tab only vs cross-tab?
  **Answer**: Cross-tab. Search applies to all tabs; tab labels show filtered counts; clicking tab shows filtered results.
  **Category**: UI-Design

- **Topic**: Instruction file granularity
  **Q11**: Deletable line-by-line or full-file?
  **Answer**: Granular preferred — instructions deletable one by one. At minimum, allow editing whole file content.
  **Category**: UI-Design

- **Topic**: Per-workspace item disabling
  **Q15**: Display-only toggle or real functionality?
  **Answer**: No display-only features. If provider doesn't support it natively, skip entirely.
  **Category**: Platform

- **Topic**: Claude Code settings surface
  **Answer**: Surface configurable settings with possible values and explanations. Include warning they may change. Surface hidden settings like `ENABLE_TOOL_SEARCH`.
  **Category**: Platform

- **Topic**: Detail view — Sheet vs Dialog
  **Q16**: Replace Sheet with centered Dialog?
  **Answer**: Yes — Dialog (max-w-2xl, h-[80vh]). Sheet pushes content; Dialog is more focused.
  **Category**: UI-Design

- **Topic**: Backdrop blur standardization
  **Q17**: Remove blur?
  **Answer**: Yes — opacity-only (no blur) across all Sheet and Dialog components.
  **Category**: UI-Design

- **Topic**: Edit/delete placement
  **Q19**: Cards or detail modal?
  **Answer**: Detail modal only. Cards stay lightweight.
  **Category**: UI-Design

- **Topic**: Line count display
  **Q20**: Show on cards?
  **Answer**: Yes — subtle monospace on card, prominent in detail modal. Only for skills, agents, memories, instructions, rules. Not hooks/MCP.
  **Category**: UI-Design

### Third Grill Round (After Provider Investigation)

- **Topic**: Provider switcher design
  **Q33**: Top-level dropdown above tabs?
  **Answer**: Yes. Show all available providers (even uninstalled — displayed as disabled, not hidden).
  **Category**: UI-Design

- **Topic**: Provider detection backend
  **Q34**: `detect_installed_providers()` checking PATH?
  **Answer**: Yes.
  **Category**: Platform

- **Topic**: Cross-provider discovery paths
  **Q35**: Scan cross-provider compatibility paths (e.g., `.agents/skills/`)?
  **Answer**: Yes.
  **Category**: Platform

- **Topic**: Skill overrides per workspace
  **Q25**: Implement `skillOverrides` in `settings.local.json`?
  **Answer**: Yes — confirmed Claude Code supports it.
  **Category**: Platform

- **Topic**: Settings tab content — all providers
  **Q37-40**: Curated settings for Claude Code, OpenCode, Codex, Cursor?
  **Answer**: Yes for all.
  **Category**: UI-Design

- **Topic**: Settings file scope selector
  **Q41**: Default writes to user-level; scope selector?
  **Answer**: Yes. Prefer editing/creating local (project) file over user file.
  **Category**: Data-State

- **Topic**: Raw JSON display
  **Q42**: Show alongside GUI controls?
  **Answer**: No raw display. Show which file/key each setting maps to as subtle text. "Open in Editor" for raw.
  **Category**: UI-Design

- **Topic**: Symlink editing
  **Q44**: Edit symlink target with warning?
  **Answer**: Yes. Edit target file, show symlink warning. Prefer local file.
  **Category**: Platform

- **Topic**: Hook deletion behavior
  **Q45**: Delete removes from settings.json only (script stays)?
  **Answer**: Yes.
  **Category**: Platform

- **Topic**: Settings as separate tab
  **Answer**: Yes — settings should be a separate tab, not inline.
  **Category**: UI-Design

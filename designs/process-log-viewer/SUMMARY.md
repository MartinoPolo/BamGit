# Process Log Viewer & MonospaceBlock — Design Summary

**Base**: Variant A | **Refined**: 2026-05-18

## Refinements Applied

Variant A was chosen and refined with: fixed scroll indicators, scroll-to-top button, single copy button (footer only), port badge in header, proper Button component styling, matched Dialog component styling. Key changes from base variant: scroll indicators moved to wrapper div outside scroll container so they stay fixed; title bar copy button removed (single copy in footer); ServerPortBadge added to title bar for dev-server commands.

## Component Map

### Codebase — Use As-Is

| Component | Path | Usage | Key Props/Variants |
|-----------|------|-------|--------------------|
| Dialog | `src/lib/components/shadcn/dialog/` | Log viewer container (Root, Content, Header, Overlay, Close) | Custom content layout (no Body/Footer — custom title bar + log area + footer) |
| Button | `src/lib/components/shadcn/button/` | Close (icon-sm ghost), Copy (sm secondary), Load full log (sm secondary), Auto-scroll toggle (sm + toggle state) | `intent="ghost" size="icon-sm"`, `intent="secondary" size="sm"` |
| ServerPortBadge | `src/lib/components/derived/command-badges/` | Port display in title bar | Compact size, `:port` format |
| Lucide icons | `@lucide/svelte/icons/*` | X (close), Copy, Check (copied), ArrowDown (auto-scroll), ChevronUp/Down (scroll pills), Download (load full log) | Path imports, `data-icon` attributes |
| CodeBlock | `src/lib/components/blocks/chat/CodeBlock.svelte` | Reference only — copy pattern (navigator.clipboard + 2s CheckIcon feedback) | N/A |

### Build Custom

| Proposed Name | Description | Why existing components don't cover it |
|---------------|-------------|----------------------------------------|
| ProcessLogViewer | Streaming log dialog with auto-scroll, stderr coloring, scroll indicators, process lifecycle states, load-full-log | Unique streaming + scroll management + line-level styling — not a generic dialog content |
| MonospaceBlock | Static monospace block with optional copy + max-height | Replaces 4+ inline `<pre>` patterns; simpler than ProcessLogViewer — no streaming or scroll management |

## Implementation Notes

- **Scroll indicator positioning**: Use a wrapper div (`position: relative; overflow: hidden`) around the scrollable log body. Scroll-to-top and scroll-to-bottom pills are `position: absolute` on the wrapper, not inside the scroll container. Show/hide with `$derived` based on `scrollTop` and `scrollHeight - scrollTop - clientHeight`.
- **Auto-scroll toggle**: `$state(true)` default. Scrolling up sets it to false. Toggle button or clicking bottom pill sets it to true. When true, `$effect` calls `scrollTo({ top: scrollHeight, behavior: 'smooth' })` on new lines.
- **Port badge**: Conditionally rendered — only when `process.ports.length > 0`. Reuse existing `ServerPortBadge` component directly in the title bar.
- **Copy button**: Single instance in footer. Uses same `navigator.clipboard.writeText()` + 2s `CheckIcon` feedback pattern as `CodeBlock.svelte`. Copies all log lines (join with `\n`).
- **Stderr coloring**: Apply `oklch(0.72 0.135 15)` (warm rose) via a CSS class. Distinguish stdout vs stderr by `stream` field on each log entry from the backend.
- **Process exit line**: Append a styled final line ("Process exited (N)", "Process timed out", "Process killed") based on process state change. Not from stdout/stderr — injected by the component.
- **Keyboard**: Escape closes dialog (Dialog handles this). No other keyboard shortcuts needed in v1.
- **Empty state**: Show "Waiting for output..." centered with pulsing terminal icon when `lines.length === 0`.
- **Load full log**: Calls `get_full_process_logs` Tauri command. Show spinner on button during fetch. Replace tail cache with full content. Button disappears after successful load.

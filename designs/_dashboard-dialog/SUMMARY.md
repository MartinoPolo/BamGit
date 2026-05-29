# Dashboard Create/Edit Dialog — Design Summary

**Base**: Variant A | **Refined**: 2026-05-25

## Refinements Applied

Variant A was chosen and refined with: compact centered color grid. See the design brief for full requirements. Key change from the base variant: color palette grid switched from `grid-template-columns: repeat(6, 1fr)` (full-width stretch) to fixed `repeat(6, 28px)` columns with `margin: 0 auto` and `width: fit-content`, matching the current `ColorPickerContent.svelte` implementation (`mx-auto grid w-fit grid-cols-6 gap-1.5`).

## Component Map

### Codebase — Use As-Is

| Component          | Path                                                             | Usage                                      | Key Props/Variants                     |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------ | -------------------------------------- |
| Dialog.*           | `src/lib/components/shadcn/dialog/`                              | Dialog container, header, body, footer     | `class="max-w-md"`                     |
| Button             | `src/lib/components/shadcn/button/`                              | Cancel + Submit actions                    | `intent="ghost"` / default (primary)   |
| Input              | `src/lib/components/shadcn/input/`                               | Name field, hex color input                | `required` for name                    |
| Label              | `src/lib/components/shadcn/label/`                               | Field labels                               | default                                |
| RepoCombobox       | `src/lib/components/derived/repo-combobox/RepoCombobox.svelte`   | GitHub repo selection (needs styling fixes) | auto-open on click+focus               |
| PathInput          | `src/lib/components/derived/path-input/PathInput.svelte`         | Local Folder, Worktree Parent Folder       | default                                |
| ColorPickerContent | `src/lib/components/derived/color-picker/ColorPickerContent.svelte` | Accent color palette (remove Separator)  | `colors={WORKSPACE_ACCENT_PALETTE}`    |

### Build Custom

| Proposed Name    | Description                                               | Why existing components don't cover it                     |
| ---------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| BranchCombobox   | Combobox for branch selection with disabled state          | No branch picker exists. Simpler than RepoCombobox — no remote search, no privacy icons. Same Bits UI Combobox pattern, same Select-aligned styling. |

## Implementation Notes

- **RepoCombobox styling fixes**: Change container from `bg-surface-3` to `bg-surface`, add `p-1.5` to content, change item padding from `px-3` to `px-2`, add `rounded-sm` to items. Add `onfocus` and `onclick` handlers on `Combobox.Input` to set `open = true`.
- **BranchCombobox**: Can reuse same Bits UI `Combobox.Root` pattern. Disable via wrapping div with `opacity-0.7` + `pointer-events: none` when no repo selected. Fetch branches on open via new `list_repo_branches` Tauri command.
- **Worktree auto-default**: Use `$effect` watching `localFolder` — when it changes and `!worktreeManuallyEdited`, set `worktreeParentFolder = localFolder + '-worktrees'`. Set flag on `oninput` of worktree field.
- **ColorPickerContent**: Remove `<Separator class="my-2" />` at line 179. Grid already uses `mx-auto grid w-fit grid-cols-6 gap-1.5` — no CSS change needed for the grid itself.
- **Portfolio removal**: Delete `src-tauri/src/commands/portfolio_commands.rs`, remove from `mod.rs` and `lib.rs` invoke_handler. Remove `portfolio_dashboard_pointers` table from `schema.rs`. Update `dashboards.type` CHECK to `('repo')` only. Clean up TS types, board context, i18n, mocks (~31 files total).

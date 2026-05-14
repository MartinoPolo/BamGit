# shadcn-Svelte Conventions Audit

Created for staged Grovekeeper rollout. This is an audit gate, not approval for broad rewrites.

## Base Component Variant Axes

Approved axis names:

| Component | Axis | Decision |
| --- | --- | --- |
| Alert | `tone` | Replaces `variant`; alert values are semantic tones. |
| Badge | `tone` | Color semantics only: `neutral`, `success`, `warning`, `danger`, `info`, `primary`, `accent`, `merged`. |
| Badge | `format` | Presentation only: `default`, `mono`. Former `mono` variant becomes `format="mono"`. |
| Badge | `size` | Keep. |
| Button | `intent` | Replaces `variant`; values describe action intent/treatment. |
| Button | `size` | Keep. |
| Card | `padding` | Keep. |
| Card | `state` | Keep. |
| HelpText | `state` | Replaces `status`; aligns with Input, Select, Textarea. |
| Input | `state` | Keep. |
| Kbd | `format` | Replaces `variant`; values describe content/font format. |
| Kbd | `tone` | Keep. |
| Select | `state` | Keep. |
| StatCell | `tone` | Keep. |
| Tabs | `active` | Keep. |
| Textarea | `state` | Keep. |
| Toast | `tone` | Keep. |

Components without styling axes today: Accordion, Calendar, Checkbox, ContextMenu, Dialog, DropdownMenu, Label, Popover, Progress, RadioGroup, RangeCalendar, Separator, Sheet, Switch, Tooltip, SearchField, StatusRow.

## Base Component Normalization

- `Button` remains the template: `tv()` owns styles; keyed types and constants derive from `tv()`; stories use exported constants.
- `Button` uses `intent`, not `variant`.
- `Alert` uses `tone`, not `variant`.
- `Badge` uses `tone` + `format`; no mixed color/typography variant axis.
- `Kbd` uses `format` + `tone`.
- `HelpText` uses `state`.
- `Card` now keeps `padding` and `state` in `cardVariants`; no parallel `CARD_STATE_CLASSES`.
- `Toast` no longer uses `VariantProps`; `ToastTone` derives from `toastVariants.variants.tone`.
- `Button` Storybook includes a `Data Icon Sizing` showcase for `data-icon="inline-start"` and `data-icon="inline-end"`.
- Repeated custom Select primitive compositions should become focused wrappers only when the call site repeats a domain API or product pattern.

## Raw Button Resolution Decisions

Migration rule: plain actions become `Button`; repeated custom interaction patterns get wrappers; invisible scene hit targets, upload/drop targets, color swatches, and Storybook chrome can keep raw internals.

| Area | Decision | Reasoning |
| --- | --- | --- |
| `src/routes/usage/+page.svelte`, `DateRangePicker.svelte` | Create `SegmentedControl`/period picker wrapper. | Same selected-button pattern appears twice; needs pressed state semantics and compact styling. |
| `src/routes/ai-config/+page.svelte` | Use shadcn `Tabs` or local tabs wrapper. | Hand-rolled tabs duplicate semantics. |
| `ThemeDecorator.svelte` | Keep. | Storybook infrastructure; not product UI. |
| Dependency graph view/filter controls | Create graph toolbar controls; convert canvas zoom buttons to `Button`. | Toolbar state is domain-specific; zoom/reset are normal icon actions. |
| Workspace cards and add card | Create clickable-card shell. | Card-as-button with nested controls needs one reusable accessibility pattern. |
| Wizard option cards and GitHub result rows | Create option-card/list-row wrappers; convert skip action to `Button`. | Selection rows are not normal buttons; skip is a normal action. |
| Color theme picker option rows | Use menu/select item pattern. | Popover option buttons should share item semantics. |
| Sound pool/chip play controls | Create `SoundPlayButton`/sound chip action wrapper. | Repeated audio-specific compact control. |
| `PoolDropZone.svelte` import action | Convert to `Button`. | Normal action inside custom zone. |
| `AvatarUpload.svelte` | Keep. | File/drop target; Button would hide upload/drop semantics. |
| Bulk import tree rows | Create tree/list row wrapper. | Selection rows with nested checkboxes need dedicated semantics. |
| GitHub auth device-code copy block | Keep. | Large copy target with code display; visually not a standard Button. |
| AI config source disclosure/remove | Convert to `Button`. | Disclosure and remove are ordinary controls. |
| AI config selectable item rows | Create selectable row wrapper. | Nested action buttons make generic Button unsafe. |
| AI config file-path actions | Create shared path action, likely Button-backed. | Same clickable path behavior appears in multiple dialogs. |
| Chat tool group headers | Create disclosure header wrapper. | Repeated expand/collapse header pattern. |
| Session image strip controls | Convert to `Button`. | Compact icon actions. |
| Agent tree row | Create tree item wrapper. | Tree node with nested expander. |
| Forest context menu | Use shadcn menu primitives. | Existing raw menu duplicates menu behavior. |
| Forest tree/ground hit targets | Keep. | Visual scene hit areas, intentionally custom. |
| GitHub badge action | Create badge-action wrapper. | Clickable badge should not look like normal Button. |
| Color picker swatches | Keep raw inside color-picker internals. | Swatch grid is a specialized control. |
| Sidebar collapsed item | Keep raw inside wrapper. | Already a component boundary. |
| Issue sortable headers, section toggles, priority chips | Create table/header/chip wrappers. | Repeated data-table and chip controls need reusable semantics. |

Base Storybook raw controls still under review:

| File | Lines | Recommendation |
| --- | ---: | --- |
| `src/lib/components/shadcn/select/Select.stories.svelte` | 128 | Convert the static open-dropdown mock to actual custom Select primitives or keep as visual anatomy demo. |
| `src/lib/components/shadcn/tooltip/Tooltip.stories.svelte` | 21, 42, 64, 85, 106, 156, 182, 196, 210, 224 | Convert to `Button` through the tooltip trigger child/as-child API after trigger semantics are reviewed. |
| `src/lib/components/shadcn/tooltip/WithTooltip.stories.svelte` | 30, 49, 68, 87, 109, 129, 141, 153, 165 | Convert as-child examples to `Button` after verifying prop forwarding. |

## Other Component Usage Findings

- Native `<select>` remains in dependency graph filter/view controls; convert to `Select` unless browser-native behavior is explicitly required.
- `PopoverDivider` is the canonical separator wrapper for popover internals; outside shadcn components, prefer `Separator`.
- Select strategy is sound: simple dropdowns use native `Select`; grouped/portal/rich dropdowns use custom Select primitives; repeated domain APIs get wrappers.

## Review Gates

- Base variant-axis renames above are applied.
- Raw `<button>` conversions should follow the resolution table; large wrapper work remains staged.
- `data-icon` should not become a project-wide rule until the Storybook showcase is visually approved.

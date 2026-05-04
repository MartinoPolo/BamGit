# PRD #88 — Forest View State Mapping: Grilling Summary

> **Status:** Resolved. All open questions finalized in grilling session 2026-05-01. Canonical mapping: `.mpx/STATE_MAPPING.md`
>
> **Last updated:** 2026-05-01

---

## Resolved Decisions

### Layout & Scene

| Decision         | Resolution                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout algorithm | Replace semicircle rings with row-based equidistant layout (PRD tree centered, unblocked trees alternate L/R in row 1, blocked trees in depth rows behind)    |
| Aspect ratio     | Responsive — no fixed ratio. Forest fills window width, height controlled by resizer. Mobile planned (Android via Tauri v2) — layout should remain responsive |
| Empty state      | Sky gradient + ground strip + centered seed illustration + "Plant your first tree" CTA                                                                        |
| Performance      | Animations only on row 1 trees. Rows 2+ are static. Desktop SVG handles 50+ trees fine (tested with 100 in web)                                               |

### Bottom Panel Interaction

| Decision              | Resolution                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| Panel model           | **Option D — Unified Selection Bus.** Global `selectedIssueId` + `hoveredIssueId`. Every view reacts naturally. |
| Replace-type views    | Issue Detail, Session — update to show selected issue                                                           |
| Filter-type views     | Activity — filters to selected issue                                                                            |
| Highlight-type views  | Dependencies — highlights node                                                                                  |
| PRD Overview          | Default. Replaced by Issue Detail on non-PRD selection. If no Replace view open, first neutral panel switches.  |
| Toggle deselect       | Clicking an already-selected tree deselects it (shows PRD overview)                                             |
| Escape / click ground | Deselects, panels revert to unfiltered/default                                                                  |
| Bidirectional hover   | Hover in bottom panel → forest tree glows. Hover in forest → bottom panel highlights.                           |

### Glow Overlay

| Trigger                 | Color                                                  | Priority    | Notes                                   |
| ----------------------- | ------------------------------------------------------ | ----------- | --------------------------------------- |
| Hover                   | Yellow (`#ffd700`), configurable                       | 1 (highest) | Transient                               |
| Selected                | Blue (`#4a9eff`), configurable                         | 2           | Persists until deselect                 |
| Error/urgent            | Red, configurable                                      | 3           | Severe attention needed (TBD threshold) |
| Approved/ready-to-merge | Green (not gold — too similar to yellow), configurable | 4 (lowest)  | Stage-driven                            |

All glow colors configurable in settings via color picker matching the library's hex format.

### Tool/Accessory Assignments (Agreed)

| Tool             | Meaning                                                                                               | Animation                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **stormCloud**   | Error/damage (session errored, worktree failed, merge conflict, changes-requested)                    | Animated                                                             |
| **speechBubble** | Needs human input. Supports color: red (error), orange (warning), white (info).                       | Not animated. Library enhancement needed for color.                  |
| **grill**        | HITL label present on issue                                                                           | Static = available for grilling. Animated = grilling session active. |
| **woodpecker**   | Something is being reviewed/checked (PR review-requested, session in reviewing/checks phase)          | Animated                                                             |
| **wateringCan**  | Growth/transient progress (e.g., worktree being created). NOT for session running/paused distinction. | Animated for active progress                                         |

### Other

| Decision        | Resolution                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Demo workspace  | Database seed command (`seed_demo_workspace`). Creates dummy dashboard + 15+ issues covering every stage, state, depth row. No real repo needed. |
| DAG algorithm   | Sugiyama via `dagre`, left-to-right flow                                                                                                         |
| Tooltip content | Text-only: issue title + status. No thumbnail. No assignee (single-dev tool).                                                                    |
| Context menu    | Shell with event emission. Handlers disabled until #89/#90/#91 land.                                                                             |
| `winter` stage  | Not standalone. Part of `seasonal` for evergreen trees. Won't be used as a mapped stage.                                                         |
| `wilting` stage | May be used for PR closed without merge (unhealthy/declining state). See open questions.                                                         |

---

## Revised Tree Lifecycle (Agreed Direction)

The user wants the lifecycle to follow the **natural botanical progression** and the **actual developer workflow**:

```
seed → sprouting → sapling → growing → leafy → [draft PR] → flowering (PR open) → [approved] → fruiting (ready to merge) → bare (merged) → stump (archived)
```

**Key insight:** Flowering comes BEFORE fruiting (botanical order). Flowers → fruit is the natural progression:

- **Flowering** = PR is open, being reviewed (tree is blossoming)
- **Fruiting** = PR is ready to merge (fruit is mature, ready to harvest)

### User's Happy Path Workflow (needs diagram)

The user requested a detailed workflow diagram covering:

1. Planning (issue creation)
2. Worktree + branch creation
3. Execution: analysis → TDD (test, implement, refactor) → checks → reviews → commit → push
4. PR creation (draft → open)
5. Review cycle (request review, receive feedback, fix)
6. CI green → ready to merge
7. Merge to dev
8. Error handling at each step
9. Waiting states

This diagram should map each workflow step to a tree stage + accessories, showing the visual progression chronologically.

---

## Open Questions (Require Dedicated Grilling Session)

### Stage Cascade

1. **Draft PR stage:** `leafy` + tool indicator (shovel?) vs early `flowering` vs new `budding` sub-stage. User agrees draft is meaningfully different from open PR.

2. **PR approved stage:** Discrete jump to `fruiting`? Or gradual flowering→fruiting transition (library enhancement for mixed flowers + fruit)?

3. **PR closed without merge:** User objected to `leafy` (that's a healthy state). Proposed `wilting` (unhealthy, declining). Needs confirmation and edge case analysis (closed + branch deleted vs closed + branch exists).

4. **`prState=merged` handling:** Simplified to just `bare` regardless of GitHub issue state. Confirmed by user.

5. **Session state visual signals:** User objects to wateringCan for running/paused session. WateringCan should mean "growth/transient progress" (e.g., worktree creation), not "session active." What indicates a running session? Options: animation state of the tree itself (canopySway when running?), a different tool, or just the `growing` stage being enough.

6. **Fruit count semantics:** PRD says fruit count = session count. User said this needs more thinking. Alternative: fruit count reflects PR approval stages (flowers → fruit one by one as reviews come in).

7. **Behind-base visual:** PRD says "wind blowing leaves." Library lacks wind effect. Options: (A) defer to V1 tooltip/badge, (B) library enhancement for wind canopy sway, (C) falling leaf particles in wind direction.

8. **Red glow threshold:** What actions are severe enough for red pulsing glow? All `needs-input`? Only `errored`? Only `needs-input` + `errored`?

9. **Speech bubble color:** Library needs enhancement to support colored speech bubbles. What color mapping? Red = error, orange = warning, white = info?

10. **Woodpecker timing:** User suggested woodpecker for session `reviewing` execution phase AND `prState=review-requested`. Confirm both.

### Accessory Conflicts

11. **Multiple stormCloud triggers:** Session errored + merge conflict + changes-requested all use stormCloud. Only one can show. Priority order? How to communicate multiple issues?

12. **Paused session indicator:** User rejected wateringCan for paused. What indicates a paused session? No tool? Static tree? Different accessory?

### User Objections (Verbatim Summary)

- "Flowering should come before fruiting" — botanical order matters
- "Draft PR is significantly different from open PR" — needs distinct visual
- "Watering can should indicate growth, not running vs paused session"
- "PR closed without merge is not a healthy state — not leafy"
- "Approved is different from ready-to-merge" — reviewer approval vs CI green
- "Gold glow is too similar to yellow hover" — use green for approved states
- "Woodpecker is more like something that reviews or fixes" — not just PR review-requested
- "Speech bubble should support colors — red for error, orange for warning"
- "Grill should display whenever HITL label exists, animated only when grilling session active"
- "Storm cloud for errors looks natural"
- "Transient states (worktree pending) should use tools with animation"
- "We need a chronological workflow diagram mapping each step to tree visuals"

### My Updated Suggestions (for next grilling session)

**Revised stage cascade (incorporating user feedback):**

| #   | Condition                                                                       | Stage                      | Rationale                                                   |
| --- | ------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| 1   | worktreeState=`removed` AND grovekeeperStatus=`archived`                        | **stump**                  | Fully cleared                                               |
| 2   | branchStatus=`deleted`                                                          | **dead**                   | Branch abandoned                                            |
| 3   | branchStatus=`remote-gone` AND prState≠`merged`                                 | **dead**                   | Remote abandoned                                            |
| 4   | prState=`merged`                                                                | **bare**                   | Lifecycle complete (regardless of issue state)              |
| 5   | prState=`closed` (not merged)                                                   | **wilting**                | PR abandoned/rejected — unhealthy state                     |
| 6   | prState=`ready-to-merge`                                                        | **fruiting**               | Mature, ready to harvest. Green glow.                       |
| 7   | prState=`approved`                                                              | **fruiting**               | Approved but maybe waiting for CI. Fewer fruit?             |
| 8   | prState=`changes-requested`                                                     | **seasonal**               | Autumn setback                                              |
| 9   | prState=`review-requested` OR prState=`open`                                    | **flowering**              | Blossoming, under review                                    |
| 10  | prState=`draft`                                                                 | **leafy** + tool indicator | Work done, PR not ready. TBD: which tool?                   |
| 11  | sessionState IN {`running`, `needs-input`, `needs-review`, `paused`, `errored`} | **growing**                | Active work                                                 |
| 12  | hasCommitsOnBranch AND prState=`no-pr`                                          | **leafy**                  | Work done, no PR yet                                        |
| 13  | worktreeState=`active` AND branchStatus IN {`active`, `local-only`}             | **sapling**                | Ready for work                                              |
| 14  | worktreeState IN {`pending`, `failed`}                                          | **sprouting**              | Setting up. wateringCan for pending. stormCloud for failed. |
| 15  | (fallback)                                                                      | **seed**                   | Just an idea                                                |

**Revised accessory mapping (incorporating user feedback):**

| Condition                   | Tool                             | Animated?                         | Notes                                                       |
| --------------------------- | -------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| worktreeState=`pending`     | wateringCan                      | Yes                               | Transient growth progress                                   |
| worktreeState=`failed`      | stormCloud                       | Yes                               | Setup error                                                 |
| sessionState=`errored`      | stormCloud + speechBubble (red)  | storm animated, bubble static     | Error with attention needed                                 |
| sessionState=`needs-input`  | speechBubble (orange or red TBD) | No                                | Needs user input                                            |
| sessionState=`needs-review` | speechBubble (white)             | No                                | Needs human review                                          |
| sessionState=`running`      | TBD (not wateringCan)            | —                                 | User rejected wateringCan. Maybe just canopySway animation? |
| executionPhase=`reviewing`  | woodpecker                       | Yes                               | Session running checks                                      |
| prState=`review-requested`  | woodpecker                       | Yes                               | PR awaiting human review                                    |
| prState=`changes-requested` | stormCloud                       | Yes                               | Reviewer rejection                                          |
| syncStatus=`merge-conflict` | stormCloud                       | Yes                               | Conflict                                                    |
| syncStatus=`behind-base`    | TBD (wind effect?)               | —                                 | Needs library enhancement or defer to tooltip               |
| label=`HITL`                | grill                            | Only when grilling session active | Static = available. Animated = in progress.                 |

---

## Deferred Items to Other PRDs

| Item                                   | Target PRD              | Action                 |
| -------------------------------------- | ----------------------- | ---------------------- |
| Click grill → start grilling session   | #92 (AFK/HITL Workflow) | Add as GitHub comment  |
| Issue detail component in bottom panel | #89 (Issue Management)  | Add as GitHub comment  |
| Context menu action handlers           | #89, #90, #91           | Add as GitHub comments |
| Session tab content                    | #90 (Sessions)          | Add as GitHub comment  |
| Git/GitHub badge data for tooltips     | #91 (Git/GitHub)        | Add as GitHub comment  |

---

## Sub-Issue Breakdown (Pending)

The following consolidated breakdown (5-8 issues) is BLOCKED until the state mapping grilling is complete:

1. **Forest layout algorithm and scene rendering** — layout + sky/ground + empty state + stage mapping
2. **Collapsible split panel with tabbed bottom section** — collapse/expand + resizer + tabs + PRD overview
3. **Tree interaction and global selection bus** — hover/selection/tooltip + context menu + bidirectional sync + configurable glow
4. **Dependency graph view** — dagre DAG in Dependencies tab
5. **Forest demo workspace** — database seed with all stages/states
6. (Possible additional slices TBD after state mapping is finalized)

Each issue will be created via `gh issue create` and linked as a sub-issue of PRD #88 once the state mapping is resolved.

# Forest View — State-to-Visualization Mapping

> **Status:** Finalized (2026-05-01)
> **Source:** Grilling session resolving all open questions from PRD #88
> **Canonical reference** for how issue state maps to tree appearance, accessories, overlays, and animations.

---

## Stage Cascade

Priority-ordered rule table. First matching rule wins — evaluated top-to-bottom.

| #   | Condition                                                                        | Stage         | Notes                                         |
| --- | -------------------------------------------------------------------------------- | ------------- | --------------------------------------------- |
| 1   | `worktreeState=removed` AND `grovekeeperStatus=archived`                         | **stump**     | Fully cleared, lifecycle complete             |
| 2   | `branchStatus=deleted`                                                           | **dead**      | Branch abandoned                              |
| 3   | `branchStatus=remote-gone` AND `prState!=merged`                                 | **dead**      | Remote abandoned (not merged)                 |
| 4   | `prState=merged`                                                                 | **bare**      | Lifecycle complete, regardless of issue state |
| 5   | `prState=closed` (not merged)                                                    | **wilting**   | PR rejected/abandoned                         |
| 6   | `prState=ready-to-merge`                                                         | **fruiting**  | Mature, ready to harvest. Green glow (5)      |
| 7   | `prState=approved`                                                               | **fruiting**  | Approved, CI may be pending. Green glow (2)   |
| 8   | `prState=changes-requested`                                                      | **seasonal**  | Autumn setback — reviewer requested changes   |
| 9   | `prState=review-requested` OR `prState=open`                                     | **flowering** | Blossoming, PR is open and visible            |
| 10  | `prState=draft`                                                                  | **leafy**     | Work done, PR not ready for review            |
| 11  | `aggregateSessionState` in {running, needs-input, needs-review, paused, errored} | **growing**   | Active work in progress                       |
| 12  | `hasCommitsOnBranch` AND `prState=no-pr`                                         | **leafy**     | Work done, no PR yet                          |
| 13  | `worktreeState=active` AND `branchStatus` in {active, local-only}                | **sapling**   | Ready for work, no session run yet            |
| 14  | `worktreeState` in {pending, failed}                                             | **sprouting** | Setting up (pending) or setup failed          |
| 15  | (fallback)                                                                       | **seed**      | Just an idea — GH issue exists, nothing else  |

### Botanical Progression

```
seed → sprouting → sapling → growing → leafy → flowering → fruiting → bare → stump
                                                    ↑            ↑
                                              (PR open)    (PR approved)
```

Side branches: `seasonal` (changes-requested setback), `wilting` (PR closed), `dead` (branch gone).

### Aggregate Session State Priority

When an issue has multiple sessions, the worst active state wins:

```
needs-input > errored > needs-review > running > paused > finished > no-session
```

---

## Execution Phase Tools

When a session is actively running, the execution phase determines which tool appears at the tree's trunk. Tools swap as phases change — the gardener's work progresses visually.

| Execution Phase            | Tool                    | Anchor    | Animation              |
| -------------------------- | ----------------------- | --------- | ---------------------- |
| Analyzing (Step 2)         | **lantern** (NEW)       | trunkBase | Infinity-sign path     |
| TDD / Building (Step 4)    | **shovel**              | trunkBase | Digging swing          |
| Reviewing (Step 5)         | _none_                  | —         | Birds carry the signal |
| Fixing (Steps 5b, 6b, 10b) | **shovel**              | trunkBase | Digging swing          |
| Checks / Testing (Step 6)  | **pruningShears** (NEW) | trunkBase | Snipping motion        |
| Shipping (Steps 8-11)      | **rake**                | trunkBase | Horizontal slide       |

### Compound Tools (Fixing Context)

When fixing issues found by a specific phase, shovel appears at trunkBase alongside birds that indicate WHAT is being fixed:

| Fixing Context         | trunkBase Tool | Birds in Canopy  | Visual Reads As                     |
| ---------------------- | -------------- | ---------------- | ----------------------------------- |
| Fixing review findings | shovel         | robin (executor) | Builder fixing what reviewers found |
| Fixing check failures  | shovel         | robin (executor) | Builder fixing what checks caught   |
| Fixing CI failures     | shovel         | robin (executor) | Builder fixing CI-specific issues   |

During the reviewing phase itself: no tool at trunk, but cardinals (reviewer sub-agents) + sparrow (checker) appear in the canopy.

### Future Split-Session Model

When execution moves to separate sessions per phase, each session type maps to one tool:

| Session Type     | Tool          |
| ---------------- | ------------- |
| Execution        | shovel        |
| Review           | woodpecker\*  |
| Checks           | pruningShears |
| Ship (commit/PR) | rake          |

\*Woodpecker is not in the current active mapping but may return for dedicated review sessions.

---

## State-Driven Accessories

Accessories triggered by issue/session/git state, independent of execution phase.

| Condition                   | Accessory                 | Anchor    | Animation                                      |
| --------------------------- | ------------------------- | --------- | ---------------------------------------------- |
| `worktreeState=pending`     | **wateringCan**           | trunkBase | Pour motion (transient growth)                 |
| `sessionState=paused`       | **ladder**                | trunkBase | Gentle wobble (someone stepped away)           |
| `label=HITL`                | **grill**                 | trunkBase | Static = available; Animated = grilling active |
| `sessionState=errored`      | **speechBubble (red)**    | crownTop  | Static                                         |
| `sessionState=needs-input`  | **speechBubble (orange)** | crownTop  | Static                                         |
| `syncStatus=merge-conflict` | **stormCloud**            | crownTop  | Float up/down                                  |
| `worktreeState=failed`      | **stormCloud**            | crownTop  | Float up/down                                  |
| `syncStatus=behind-base`    | **mushrooms** (NEW)       | trunk     | Static (binary: present or absent)             |

### What Is NOT Used

| Tool/Accessory                       | Reason                                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| **woodpecker**                       | Dropped — birds in canopy replaced its reviewing function          |
| **axe**                              | No mapped state                                                    |
| **speechBubble (white)**             | needs-review doesn't warrant a speech bubble (card badge suffices) |
| **stormCloud for errored**           | Speech bubble (red) handles errors — avoids crownTop conflict      |
| **stormCloud for changes-requested** | Seasonal stage already communicates the setback                    |

### Speech Bubble Colors

The library needs enhancement to support colored speech bubbles (currently single-color). Minimum colors:

| Color  | Hex       | Meaning                           |
| ------ | --------- | --------------------------------- |
| Red    | `#ff4444` | Session errored — something broke |
| Orange | `#ff8c00` | Needs input — agent is blocked    |

Speech bubble and stormCloud never co-occur (no crownTop conflict).

### trunkBase Priority

When multiple trunkBase accessories could apply, show the highest priority (mutually exclusive in practice):

1. Execution phase tool (session running, not paused)
2. Ladder (session paused)
3. Grill (HITL label, no active session)
4. WateringCan (worktree pending — no session possible yet)

---

## Sub-Agent Birds

Sub-agents spawned during execution appear as birds in the tree's canopy at `branchTips` anchor points.

| Bird            | Agent Category    | Examples                                  |
| --------------- | ----------------- | ----------------------------------------- |
| **Owl**         | Analysis/planning | mp-issue-analyzer                         |
| **Robin**       | Builder/executor  | mp-tdd-executor, mp-executor              |
| **Sparrow**     | Checker           | mp-checker                                |
| **Cardinal**    | Reviewer          | mp-reviewer-code-quality, mp-reviewer-\*  |
| **Hummingbird** | Utility/fast ops  | mp-git-committer, mp-pr-manager           |
| **Parrot**      | Research/docs     | mp-context7-docs-fetcher, mp-docs-updater |

### Behavior

- **Appear** when sub-agent starts (fly in / fade in)
- **Animated** while sub-agent is active (subtle idle: head turn, wing ruffle)
- **Fade out** when sub-agent finishes
- **Multiple of same type** for parallel agents (e.g., 3 cardinals for 3 parallel reviewers)
- **Tooltip** shows agent name and type
- **Clickable** to view sub-agent output

### Library Enhancement

New `birds` prop on `LowPolyTree` accepting an array of `{type, label, active}` objects. Birds render at `branchTips` positions with per-type SVG assets. 6 bird SVG assets needed.

---

## Glow Overlay

Priority-ordered glow rules. Higher priority overrides lower.

| #   | Trigger                    | Color            | Intensity | Pulse    | Notes                          |
| --- | -------------------------- | ---------------- | --------- | -------- | ------------------------------ |
| 1   | Hover                      | Yellow `#ffd700` | 3         | No       | Transient, highest priority    |
| 2   | Selected (clicked)         | Blue `#4a9eff`   | 3         | No       | Persists until deselect        |
| 3   | `sessionState=errored`     | Red `#ff4444`    | 4         | Yes (2s) | Error — immediate attention    |
| 4   | `sessionState=needs-input` | Orange `#ff8c00` | 3         | Yes (2s) | Agent blocked — look at this   |
| 5   | `prState=ready-to-merge`   | Green `#22c55e`  | 5         | No       | Everything passed, harvest now |
| 6   | `prState=approved`         | Green `#22c55e`  | 2         | No       | Approved, CI may be pending    |

All glow colors configurable in settings. Intensity range: 1-5 (maps to feGaussianBlur stdDeviation and opacity).

The approved → ready-to-merge intensity jump (2 → 5) makes "CI just went green" visually obvious.

---

## Tree Animation

Animation state communicates whether a session is actively running:

| Session State            | canopySway | animateGrowth | Visual Effect                    |
| ------------------------ | ---------- | ------------- | -------------------------------- |
| Running (active session) | Yes        | Yes           | Tree is alive and moving         |
| Paused / no session      | No         | No            | Tree is still (ladder if paused) |

Row 1 (front) trees get full animation. Rows 2+ (blocked issues behind) are always static for performance.

---

## Fruit

- **Count:** Static (3-5), decorative — does not represent session count or any metric
- **Type:** Species-matched (acorn for oak, cherry for cherry, apple for apple, etc.)
- **Visibility:** Only in `fruiting` stage (rules 6-7 in cascade)

---

## Trunk Indicators

| Indicator     | Condition                | Visual                                                         |
| ------------- | ------------------------ | -------------------------------------------------------------- |
| **Mushrooms** | `syncStatus=behind-base` | Mushroom/fungi clusters growing on the trunk (visible on bark) |

Binary: present when behind, absent when synced. No gradation (1 commit behind and 10 commits behind look the same — both need syncing).

Mushrooms attach directly to the trunk (not ground level) so they are clearly visible ON the tree, signaling something is wrong with it. Library enhancement: new trunk decoration rendered on the trunk surface.

---

## Library Enhancements Needed

Summary of all changes required in `low-poly-2d-trees`:

| Enhancement            | Type         | Description                                                 |
| ---------------------- | ------------ | ----------------------------------------------------------- |
| **lantern** tool       | New tool SVG | Warm lantern with infinity-sign (lemniscate) path animation |
| **pruningShears** tool | New tool SVG | Garden shears with snipping motion animation                |
| **mushroom** trunk     | New element  | Fungi clusters attached to trunk (behind-base indicator)    |
| **speechBubble color** | Enhancement  | Color prop on speechBubble tool (currently single-color)    |
| **birds** system       | New feature  | 6 bird SVGs at branchTips, per-type, with appear/fade       |

Existing tools already in library: shovel, wateringCan, ladder, rake, grill, speechBubble, stormCloud, woodpecker, axe.

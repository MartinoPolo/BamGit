# Architecture Review: Deep Module Analysis

## Current Architecture — The Shallow Layer Problem

```mermaid
graph TB
    subgraph UI ["UI Layer (3 pages)"]
        IP["issues/+page.svelte<br/>406 lines, 9 contexts"]
        SP["sessions/+page.svelte"]
        SET["settings/+page.svelte"]
    end

    subgraph CTX ["Context Layer (10 files — thin state holders)"]
        IC["issues.context"]
        SC["sessions.context"]
        GC["github.context"]
        GSC["git_status.context"]
        DC["dashboard.context"]
        NC["notifications.context"]
        CPC["color_palettes.context"]
        TC["theme.context"]
        VC["view_preference.context"]
        AC["actions.context"]
    end

    subgraph ENG ["Engine (4 pure functions)"]
        ASS["aggregateSessionState"]
        MSD["mapIssueToStateDimensions"]
        CTV["computeTreeVisualization"]
        FL["forestLayout"]
    end

    subgraph TAURI ["Tauri IPC Wrappers (11 files, ~80 pass-through functions)"]
        TI["issue_commands.ts<br/>+ label deserialization"]
        TS["session_commands.ts"]
        TGH["github_commands.ts"]
        TGS["git_status_commands.ts"]
        TD["commands.ts"]
        TW["worktree_commands.ts"]
        TA["action_commands.ts"]
        TN["notification_commands.ts"]
        TCP["color_palette_commands.ts"]
        TP["portfolio_commands.ts"]
        TL["label_shape_mapping_commands.ts"]
    end

    subgraph TYPES ["Types (14 files — scattered, some with logic)"]
        TYI["issue.ts"]
        TYS["session.ts"]
        TYGH["github.ts<br/>GitHubStatusCache"]
        TYGS["git_status.ts<br/>GitStatusCache"]
        TYTV["tree_visualization.ts<br/>261 lines: types + constants<br/>+ factory + business logic"]
        TYD["dashboard.ts"]
        TYN["notification.ts"]
        TYCP["color_palette.ts"]
        TYW["worktree.ts"]
        TYA["action.ts"]
    end

    subgraph RUST ["Rust Backend"]
        subgraph RCMD ["Commands (11 files, 40+ commands)"]
            RI["issue_commands.rs<br/>positional row.get(N)"]
            RS["session_commands.rs"]
            RGH["github_commands.rs<br/>gh CLI + GraphQL"]
            RGS["git_status_commands.rs"]
            RD["dashboard commands"]
            RW["worktree_commands.rs"]
        end
        subgraph RSESS ["Session Subsystem (6 files)"]
            RA["session_actor.rs<br/>state machine (DUPLICATE)"]
            RP["protocol_parser.rs"]
            RDI["discovery.rs"]
            RDP["discovery_polling.rs"]
            RM["manager.rs"]
            RPR["provider.rs trait"]
        end
        subgraph RDB ["Database"]
            RCONN["connection.rs<br/>Single Mutex&lt;Connection&gt;"]
            RSCH["schema.rs<br/>9 tables"]
        end
    end

    IP --> IC & SC & GC & GSC & DC & NC & CPC & TC & VC
    SP --> SC
    SET --> CPC & NC

    IP --> MSD --> CTV --> FL
    SC --> ASS

    IC --> TI
    SC --> TS
    GC --> TGH
    GSC --> TGS
    DC --> TD
    AC --> TA
    NC --> TN
    CPC --> TCP

    TI --> RI
    TS --> RS
    TGH --> RGH
    TGS --> RGS
    TD --> RD

    RS --> RA
    RA --> RP & RM

    RCMD --> RCONN
    RSESS --> RCONN

    style TYTV fill:#ff6b6b,color:#fff
    style RA fill:#ff6b6b,color:#fff
    style SC fill:#ff6b6b,color:#fff
    style RCONN fill:#ff6b6b,color:#fff
    style IP fill:#ff6b6b,color:#fff
    style TYGH fill:#ffaa00,color:#000
    style TYGS fill:#ffaa00,color:#000
```

**Red = high-friction areas. Orange = type duplication.**

### What's wrong with this picture

| Problem                                 | Where                                                                     | Impact                                           |
| --------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| **5 layers to cross** for any operation | UI → Context → Tauri → Rust Cmd → DB                                      | Understanding one feature means reading 5+ files |
| **Pass-through epidemic**               | 80 tauri wrapper functions that just call `invoke()`                      | Interface as complex as implementation (shallow) |
| **Dual state machines**                 | `session_actor.rs` + `sessions.context.svelte.ts`                         | Same logic in 2 languages, manual sync           |
| **Type drift**                          | `GitStatusCache` vs `GitHubStatusCache`, `ready-to-merge` missing in Rust | Runtime bugs from compile-time mismatches        |
| **God component**                       | `issues/+page.svelte` orchestrates everything                             | Untestable, hard to navigate                     |
| **Single DB lock**                      | One Mutex for 40+ commands                                                | All reads block all writes                       |
| **Mixed concerns in types**             | `tree_visualization.ts` has logic + constants + types                     | Can't import types without pulling everything    |

---

## Proposed Architecture — Deep Domain Modules

```mermaid
graph TB
    subgraph UI ["UI Layer (pages — thin orchestrators)"]
        IP["issues/+page.svelte<br/>(~150 lines, delegates to modules)"]
        SP["sessions/+page.svelte"]
        SET["settings/+page.svelte"]
    end

    subgraph MODULES ["Deep Domain Modules (small interface, large implementation)"]
        subgraph IM ["Issue Module"]
            direction TB
            IMI["Interface:<br/>loadIssues() addIssue() updateIssue()<br/>removeIssue() issues (reactive)"]
            IMH["Hidden: label serialization,<br/>positional indexing, IPC,<br/>SQLite, RawIssue transform"]
        end

        subgraph SM ["Session Module"]
            direction TB
            SMI["Interface:<br/>spawnSession() terminateSession()<br/>sessions (reactive)<br/>sessionsByIssueId (derived)"]
            SMH["Hidden: protocol parsing,<br/>state machine, actor lifecycle,<br/>discovery polling, aggregation"]
        end

        subgraph DM ["DevState Module<br/>(merged GitHub + Git Status)"]
            direction TB
            DMI["Interface:<br/>syncAll() getDevState(issueId)<br/>devStateMap (reactive)"]
            DMH["Hidden: gh CLI, GraphQL,<br/>git commands, cache merging,<br/>PR state normalization"]
        end

        subgraph VM ["Visualization Module"]
            direction TB
            VMI["Interface:<br/>computeVisualization(issue, devState, sessions)<br/>→ TreeVisualization"]
            VMH["Hidden: state dimensions,<br/>tree stages, shape rules,<br/>forest layout, constants"]
        end

        subgraph BM ["Board Module<br/>(dashboard + preferences)"]
            direction TB
            BMI["Interface:<br/>loadDashboards() selectDashboard()<br/>activeDashboard theme viewMode"]
            BMH["Hidden: SQLite, localStorage,<br/>palette management, sidebar state"]
        end

        subgraph NM ["Notification Module"]
            direction TB
            NMI["Interface:<br/>notify(event) clear(issueId)<br/>pendingNotifications"]
            NMH["Hidden: platform APIs,<br/>sound playback, urgency routing"]
        end

        subgraph AM ["Action Module"]
            direction TB
            AMI["Interface:<br/>getActions(issue) execute(actionId, issue)<br/>actions (reactive)"]
            AMH["Hidden: template variables,<br/>command execution, skill invocation"]
        end
    end

    subgraph SHARED ["Shared Infrastructure"]
        IPC["Tauri IPC<br/>(internal to each module,<br/>NOT a separate layer)"]
        TYPES["Shared Types<br/>(only cross-module contracts)"]
        REACT["Reactivity Primitives<br/>StateRaw / Persisted"]
    end

    subgraph RUST ["Rust Backend (same deep module boundaries)"]
        subgraph RISS ["Issue Service"]
            RIS1["CRUD + label serialization<br/>Named column access"]
        end
        subgraph RSESS2 ["Session Service"]
            RSS1["Actor + Protocol + Discovery<br/>Emits resolved SessionState"]
        end
        subgraph RDEV ["DevState Service"]
            RDS1["GitHub + Git unified<br/>Single DevState response"]
        end
        subgraph RDB2 ["Database"]
            RPOOL["Connection Pool<br/>Read/Write split"]
        end
    end

    IP --> IMI & SMI & DMI & VMI & BMI & NMI
    SP --> SMI
    SET --> BMI & NMI

    VMI --> IMI & DMI & SMI

    IM -.-> IPC
    SM -.-> IPC
    DM -.-> IPC
    BM -.-> IPC

    IPC --> RISS & RSESS2 & RDEV

    RISS --> RDB2
    RSESS2 --> RDB2
    RDEV --> RDB2

    style IM fill:#4ecdc4,color:#000
    style SM fill:#4ecdc4,color:#000
    style DM fill:#4ecdc4,color:#000
    style VM fill:#4ecdc4,color:#000
    style BM fill:#4ecdc4,color:#000
    style NM fill:#4ecdc4,color:#000
    style AM fill:#4ecdc4,color:#000
```

### What changes

| Before                                      | After                                                                       | Why                                              |
| ------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| Context + Tauri wrapper = 2 separate layers | **Merged into one module** — IPC is an implementation detail                | Eliminates pass-through layer entirely           |
| 14 type files shared globally               | **Types live inside their module** — only cross-module contracts are shared | Each module owns its types                       |
| github.context + git_status.context         | **One DevState module** — unified `DevState` object per issue               | Callers don't care where data came from          |
| State machine in Rust AND TypeScript        | **Rust emits resolved `SessionState`** — TS just displays it                | Single source of truth                           |
| `tree_visualization.ts` mixed concerns      | **Visualization module** owns types + constants + logic together            | Deep module: small interface, big implementation |
| `issues/+page.svelte` god component         | **Page just wires modules together** (~150 lines)                           | Logic lives in modules, not pages                |
| Single `Mutex<Connection>`                  | **Read/write connection split**                                             | Concurrent readers, WAL fully utilized           |

---

## Candidate Deep-Dives

### Candidate 1: Session Module

```mermaid
graph LR
    subgraph BEFORE ["BEFORE: 7 files, 2 languages, manual sync"]
        direction TB
        B1["types/session.ts<br/>SessionState union"]
        B2["tauri/session_commands.ts<br/>7 pass-through fns"]
        B3["sessions.context.svelte.ts<br/>RUN_STATE_MAP duplicate"]
        B4["engine/aggregate_session_state.ts"]
        B5["Rust: session_actor.rs<br/>state machine (source of truth)"]
        B6["Rust: protocol_parser.rs"]
        B7["Rust: discovery.rs + polling"]

        B3 -->|"manual sync!"| B5
        B3 --> B2 --> B5
        B3 --> B4
    end

    subgraph AFTER ["AFTER: 1 deep module, state resolved in Rust"]
        direction TB
        A1["Session Module<br/><br/>Interface (3 methods + 2 reactive):<br/>spawnSession(req)<br/>terminateSession(id)<br/>sendMessage(id, msg)<br/><br/>sessions: Session[]<br/>sessionsByIssueId: Map"]
        A2["Hidden inside:<br/>- IPC invoke() calls<br/>- Event listener setup<br/>- State machine (Rust only)<br/>- Discovery polling<br/>- Protocol parsing<br/>- Session aggregation"]

        A1 --- A2
    end

    BEFORE -->|"refactor"| AFTER

    style B3 fill:#ff6b6b,color:#fff
    style B5 fill:#ff6b6b,color:#fff
    style A1 fill:#4ecdc4,color:#000
```

**Dependency category:** Remote-owned (Tauri IPC boundary)
**Key change:** Rust actor emits resolved `SessionState` in events. TypeScript `RUN_STATE_MAP` deleted entirely.
**Risk:** Low. The Rust side already has the correct mapping. We just stop duplicating it.

---

### Candidate 2: DevState Module (GitHub + Git Status merger)

```mermaid
graph LR
    subgraph BEFORE ["BEFORE: 6 files, 2 overlapping caches"]
        direction TB
        B1["types/github.ts<br/>GitHubStatusCache<br/>pr_state: PullRequestState"]
        B2["types/git_status.ts<br/>GitStatusCache<br/>pr_state: string | null"]
        B3["tauri/github_commands.ts"]
        B4["tauri/git_status_commands.ts"]
        B5["github.context.svelte.ts<br/>cacheMap: Map"]
        B6["git_status.context.svelte.ts<br/>statusMap: Map"]

        B5 --> B3
        B6 --> B4
        B1 -.->|"type mismatch"| B2
    end

    subgraph AFTER ["AFTER: 1 module, 1 unified DevState"]
        direction TB
        A1["DevState Module<br/><br/>Interface (3 methods + 1 reactive):<br/>syncAll(dashboardId)<br/>refreshGitStatus(dashboardId)<br/>getDevState(issueId): DevState<br/><br/>devStateMap: Map&lt;string, DevState&gt;"]
        A2["DevState type:<br/>{<br/>  prState: PullRequestState | null<br/>  branchStatus: BranchStatus<br/>  issueState: string | null<br/>  syncStatus: SyncStatus<br/>  assignees: string[]<br/>  mergeConflict: boolean<br/>  behindBase: number<br/>}"]

        A1 --- A2
    end

    BEFORE -->|"refactor"| AFTER

    style B1 fill:#ffaa00,color:#000
    style B2 fill:#ffaa00,color:#000
    style A1 fill:#4ecdc4,color:#000
```

**Dependency category:** True external (GitHub API) + In-process (git status)
**Key change:** One `DevState` type replaces two overlapping caches. `pr_state` is always typed (never raw string).
**Risk:** Medium. Need to verify all consumers of the separate caches. The visualization pipeline already merges them — this just moves the merge point earlier.

---

### Candidate 3: Issue Module (collapse 3 shallow layers)

```mermaid
graph LR
    subgraph BEFORE ["BEFORE: 3 layers, leaked serialization"]
        direction TB
        B1["types/issue.ts<br/>CreateIssueRequest.labels: string|null<br/>(callers must JSON.stringify!)"]
        B2["tauri/issue_commands.ts<br/>RawIssue → Issue transform<br/>deserializeLabels()"]
        B3["issues.context.svelte.ts<br/>CRUD methods"]

        B3 --> B2 --> B1
    end

    subgraph AFTER ["AFTER: 1 module, clean interface"]
        direction TB
        A1["Issue Module<br/><br/>Interface (6 methods + 1 reactive):<br/>loadIssues(dashboardId)<br/>addIssue({ labels: Label[] })<br/>updateIssue(id, { labels: Label[] })<br/>removeIssue(id)<br/>reorderIssues(ids)<br/>getChildren(parentId)<br/><br/>issues: Issue[]"]
        A2["Hidden inside:<br/>- JSON.stringify for labels<br/>- RawIssue deserialization<br/>- IPC invoke() calls<br/>- Reactive state management"]

        A1 --- A2
    end

    BEFORE -->|"refactor"| AFTER

    style B1 fill:#ff6b6b,color:#fff
    style A1 fill:#4ecdc4,color:#000
```

**Dependency category:** Local-substitutable (SQLite via IPC)
**Key change:** Callers pass `Label[]` — serialization is hidden. No more `RawIssue` leak.
**Risk:** Low. Purely additive — wrap existing layers, then inline.

---

### Candidate 4: Visualization Module

```mermaid
graph LR
    subgraph BEFORE ["BEFORE: types file has logic, engine files scattered"]
        direction TB
        B1["types/tree_visualization.ts<br/>261 lines: types + TREE_STAGES<br/>+ SHAPE_FRUIT_MAP<br/>+ resolveTreeShape()<br/>+ createDefaultToolVisibility()<br/>+ DEFAULT_TREE_CONFIG (35 fields)"]
        B2["engine/map_issue_to_state_dimensions.ts"]
        B3["engine/compute_tree_visualization.ts"]
        B4["engine/forest_layout.ts"]

        B2 --> B1
        B3 --> B1
        B4 --> B3
    end

    subgraph AFTER ["AFTER: 1 deep module, 1 entry point"]
        direction TB
        A1["Visualization Module<br/><br/>Interface (2 functions):<br/>computeVisualization(<br/>  issue, devState, sessions,<br/>  labelMappings?<br/>): TreeVisualization<br/><br/>computeForestLayout(<br/>  items, viewport<br/>): ForestLayoutResult"]
        A2["Hidden inside:<br/>- StateDimensions computation<br/>- Tree stage rules<br/>- Shape resolution<br/>- Potted plant logic<br/>- Oak/PRD logic<br/>- All constants (TREE_STAGES etc.)<br/>- Tool visibility defaults"]

        A1 --- A2
    end

    BEFORE -->|"refactor"| AFTER

    style B1 fill:#ff6b6b,color:#fff
    style A1 fill:#4ecdc4,color:#000
```

**Dependency category:** In-process (pure computation)
**Key change:** `tree_visualization.ts` splits — types that cross module boundaries stay shared, everything else goes inside the module.
**Risk:** Low. Engine already has good tests. This is mostly file reorganization + interface simplification.

---

### Candidate 5: Database Layer (Rust)

```mermaid
graph LR
    subgraph BEFORE ["BEFORE: single mutex, no abstraction"]
        direction TB
        B1["connection.rs<br/>Mutex&lt;Connection&gt;<br/>(1 lock for 40+ commands)"]
        B2["issue_commands.rs<br/>row.get(0)..row.get(20)"]
        B3["All other commands<br/>(each locks independently)"]
        B4["session_actor.rs<br/>(6 sequential lock/release)"]

        B2 --> B1
        B3 --> B1
        B4 -->|"6x lock/release"| B1
    end

    subgraph AFTER ["AFTER: pool + named columns"]
        direction TB
        A1["Database Module<br/><br/>Interface:<br/>read_pool() → shared readers<br/>write_conn() → exclusive writer<br/><br/>query helpers:<br/>row_to_issue(row) (named columns)<br/>row_to_session(row)"]
        A2["Hidden inside:<br/>- WAL concurrent readers<br/>- Write serialization<br/>- Column name mapping<br/>- Connection lifecycle"]

        A1 --- A2
    end

    BEFORE -->|"refactor"| AFTER

    style B1 fill:#ff6b6b,color:#fff
    style A1 fill:#4ecdc4,color:#000
```

**Dependency category:** Local-substitutable (SQLite)
**Key change:** Multiple reader connections + one writer. Named column access instead of positional.
**Risk:** Medium. SQLite WAL mode supports this, but need to verify rusqlite's multi-connection behavior. Session actor benefits most (6 sequential locks become parallel reads).

---

### Candidate 6: Page Decomposition

```mermaid
graph LR
    subgraph BEFORE ["BEFORE: god component"]
        direction TB
        B1["issues/+page.svelte (406 lines)<br/><br/>- 9 context consumers<br/>- sessionsByIssueId $derived<br/>- getNotificationDotColor() inline<br/>- Issue CRUD handlers<br/>- Worktree handlers<br/>- GitHub sync triggers<br/>- Prune dialog state<br/>- Dashboard-change $effect<br/>- Forest/Cards view switch"]
    end

    subgraph AFTER ["AFTER: thin page + deep modules"]
        direction TB
        A1["issues/+page.svelte (~150 lines)<br/><br/>- 4 module consumers<br/>- View switch<br/>- Dialog triggers<br/>- Layout only"]
        A2["Logic moved to modules:<br/>- sessionsByIssueId → Session Module<br/>- notificationDotColor → Notification Module<br/>- CRUD handlers → Issue Module<br/>- Worktree handlers → Issue Module<br/>- GitHub sync → DevState Module"]

        A1 --- A2
    end

    BEFORE -->|"refactor"| AFTER

    style B1 fill:#ff6b6b,color:#fff
    style A1 fill:#4ecdc4,color:#000
```

**Risk:** Low. This naturally follows from deepening the other modules — the page gets thinner as logic moves into modules.

---

## Requirements Conflict Check

| Candidate            | Requirement                                            | Conflict?                                                                                                             |
| -------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Session Module       | R3: Multi-provider support (future)                    | **No conflict.** The `SessionProvider` trait stays. We're deepening the frontend module, not changing the Rust trait. |
| DevState Module      | R7: `gh` CLI + `git` CLI + `git2` crate                | **No conflict.** Multiple transports are an implementation detail hidden inside the module.                           |
| DevState Module      | R12: Forest view needs both git status and GitHub data | **Actually helps.** Forest view currently merges two caches — with unified DevState, it gets pre-merged data.         |
| Issue Module         | R2: Six creation paths                                 | **No conflict.** The module just needs to expose `addIssue()` with enough params. Creation paths are UI concerns.     |
| DB Layer             | R7: Performance during git/GitHub ops                  | **Actually helps.** Concurrent readers prevent sync operations from blocking UI reads.                                |
| Visualization Module | R12: 9 state dimensions, 11 stages                     | **No conflict.** The module still computes everything — just behind a smaller interface.                              |

### One potential friction point

**R3 Session modes (Spawn/Monitor/Adopt):** The Session Module must support all three modes behind the same interface. Currently, `spawnSession()` and `adoptSession()` are separate calls. The deep module should still expose both, but `sessions` (the reactive array) should be unified regardless of origin. This is already the case, so no conflict.

### Future-proofing check (Roadmap phases)

| Phase                           | Impact                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Phase 2: Evaluation Dashboard   | Needs session cost/token data → Session Module should expose `getSessionMetrics()`. Plan for this in the interface.  |
| Phase 3: Session Dashboard (R4) | Rich chat view needs session events → Session Module should expose `getSessionEvents(id)` for transcript rendering.  |
| Phase 4: Multi-Provider         | `SessionProvider` trait untouched. New providers plug into the Rust backend. Frontend Session Module doesn't change. |
| Phase 5: RAG Integration        | Needs session transcripts → same `getSessionEvents()` interface.                                                     |

---

## Reference Pattern: ts-rs (from vibe-kanban)

vibe-kanban uses the `ts-rs` crate to auto-generate TypeScript types from Rust structs. This would:

- **Eliminate F3** (ready-to-merge missing from Rust) — types are generated from Rust, so they can't drift
- **Eliminate F4** (dual state machine) — if Rust emits typed `SessionState`, TypeScript gets the same enum automatically
- **Eliminate F2** (GitStatusCache duplication) — one Rust struct → one TypeScript type

**Trade-off:** Adds a build step. Types are generated at build time, not authored manually. This is a one-time setup cost that pays dividends as the codebase grows.

**Recommendation:** Adopt `ts-rs` as part of the Session Module and DevState Module refactors. It naturally enforces the "single source of truth in Rust" principle.

---

## Suggested Priority Order

```
1. Session Module     — highest risk (dual state machine), clear win
2. DevState Module    — type drift is a bug waiting to happen
3. Issue Module       — quick win, low risk, removes pass-through layer
4. Visualization      — mostly file reorg, good cleanup
5. DB Layer           — medium effort, performance benefit grows with usage
6. Page Decomposition — falls out naturally from 1-4
```

Cross-cutting: adopt `ts-rs` during candidates 1 and 2 to prevent future type drift.

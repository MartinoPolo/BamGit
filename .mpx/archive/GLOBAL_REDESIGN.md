# Goal

Large-scale architecture and requirements discussion for Grovekeeper. Clarify what needs to be built at module level. Not every design detail — but which modules own what, and what needs future grilling per module. Output: updated docs + PRD GitHub issues.

# Exploration

Explore current state thoroughly. Fetch open GitHub issues, `@.mpx/REQUIREMENTS.md`, `@.mpx/VOCABULARY.md`, `@.mpx/ARCHITECTURE.md` (note deep modules convention: `C:\_MP_projects\mpx-claude-code\skills\mp-execute\deep-modules.md`), `@README.md`, `@AGENTS.md`, `@package.json`.

For future plans and inspiration: `@.mpx/ROADMAP.md`, `@.mpx/CAREER_RECOMMENDATIONS.md`, `@.mpx/REFERENCES.md`. All referenced open-source projects live in `C:\_MP_github_cloned`.

Explore config, linting, formatting rules, and source code to understand what's actually built. Much is implemented but not wired to UI — app is currently unusable. Not a problem; we're clarifying future steps.

Use subagents for all exploration to keep main context clean. Use as many as practical. Go deeper into `C:\_MP_github_cloned` projects for technical details and implementation strategies beyond the shallow overview in `.mpx/REFERENCES.md`.

# Rewrite of Previous Project

Grovekeeper is a rewrite of `C:\_MP_projects\obsidian-tasks-dashboard-plugin`. Explore thoroughly, especially `C:\_MP_projects\obsidian-tasks-dashboard-plugin\.mpx` folder — most requirements are documented under specific epics. Bring all meaningful requirements forward.

Key features to carry over:

- Dashboard creation with git worktree setup via quick-button from assigned GitHub issues, plus separate "add issue" workflow
- Issue state overview with badges: GitHub issue state, PR state, worktree state, git branch state. Each badge clickable where meaningful (e.g., GitHub issue badge → GitHub web)
- Color assignment per issue (auto or user dialog), propagated to all tools for that issue (VS Code, terminal, etc.). Generalize: not only VS Code but other IDEs; not only Windows terminal but cross-platform
- Keyboard accessibility: every action mapped to shortcut (create worktree, settings, Enter/Escape for dialogs). Support keyboard shortcuts wherever practical
- Per-dashboard folder and GitHub repo assignment(s) for quick access: open folder, open in editor, open in terminal, open GitHub in browser. Buttons enabled/disabled based on assignment state. If unassigned and clicked → prompt to assign, then enable
- Issue color palette from obsidian plugin but remove all gray colors (gray reserved for disabled states, bad for text readability)

# MPX Claude Code

`C:\_MP_projects\mpx-claude-code\` — Grovekeeper orchestrates this. Skills, agents, hooks, settings controlling Claude Code. Starting with Claude Code but expanding to other providers/LLMs. Study the main execution skill in detail: `C:\_MP_projects\mpx-claude-code\skills\mp-execute\SKILL.md` with all its references. Explore in subagent.

# Visualization Library

`C:\_MP_projects\low-poly-2d-trees` — tree rendering engine for issue/agent/session state visualization. Written in Svelte; take convention inspiration from there. I am the author of this project. I have full control over it. Feel free to suggest any changes to that project

# Design

`https://api.anthropic.com/v1/design/h/9xIOXwjzsfucJNjOP8zNVg?open_file=Grovekeeper+Design.html` — Claude Design first iteration. Includes design tokens (colors, typography, spacing), component and component-block designs with states, page layout ideas.

Not complete — serves as inspiration. Use the color system and relevant UI tokens. Drop tokens that are impractical or won't be used (your judgment). Map to Svelte + Tailwind + shadcn-Svelte architecture. All basic components and component blocks should have Storybook stories and tests.

# Requirements

## Internationalization

Full translation support. Start with English (default) + Czech. Prepare for Spanish, German, others. Use Paraglide (Svelte default choice, already in `low-poly-2d-trees`). Take setup inspiration from there.

## Forest View

- Each tree = one worktree and/or GitHub issue
- Center tree = PRD GitHub issue (larger). Metaphor for open vs done ratio: e.g., flowers = open issues, fruits = completed
- Smaller trees = individual GitHub issues showing current state
- Display blocking relationships: blocked issues behind blocker tree, shown as disabled. Simulated depth with up to 10 rows
- Also display blocking relationships as non-tree UI: tree diagram with UI elements (issue 1 left → lines → issues 2, 3 right)

## Issue State Representation

Previously considered tree states: PR open/merged, issue open/closed, worktree active/pruned, branch behind dev. Add:

- npm packages installed
- Database running
- Dev server running

Feel free to add more.
Display in issue overview (multi-issue dashboard) and single issue view.

## AFK / HITL Workflow

- AFK + unblocked issues = ready for autonomous execution, fetched by loop automatically
- HITL dashboard: all HITL issues sorted (most-blocking or chronological). Button to start grilling session to resolve HITL questions and unblock
- Smart HITL: background agent gathers questions per HITL issue → displayed in UI → user answers → queued for background agent processing
- Design priority: minimize user time resolving HITL issues

## Git/GitHub Integration

Fetch: GitHub issues, PR states, local/remote branch states, worktree states. Actions: commit, push, pull, sync with base branch, auto-resolve merge conflicts via agent, merge PR, resolve CI failures via agent. Use `gh` CLI or any more suitable tool. Grill specific actions and workflows later.

## GitHub Views

- Assigned issues view: quick workflow start (create worktree → grill if HITL or execute if AFK)
- PR view: active/closed PRs with state and contextual actions. Mergeable → show merge/squash-merge button. CI conflicts → show auto-resolve button. PR log: full agentic session, summary of work done, GitHub Actions results
- Full control and visibility into each executed task. Determine optimal information placement
- Worktree view: active/needs-work/fully-resolved status. Action buttons per state (prune button on dead worktrees, prune-all button for batch cleanup)

## Metrics & Statistics

Extensive AI usage metrics: tool calls, shell commands, MCP servers, skills used, tokens consumed, cost — by agent, session, tool, project, PRD, daily/weekly/monthly. Reference for inspiration: `C:\_MP_github_cloned\CodeBurn`.

Statisctics and Achievements system: "Used mp-execute 10 times", "Resolved 5 HITL issues", "3 merge conflicts auto-resolved", "Planted 10 trees", "Planted 50 trees".

## Keyboard Shortcuts

Every action wherever practical. Display shortcuts in tooltips or next to actions. Settings page for custom shortcut assignment.

## AI Configuration Access

Dedicated page (AI settings / provider settings) with tabs per category: memories, instructions (AGENTS.md, CLAUDE.md), skills, hooks, rules, MCP servers. Per item:

- Overview with quick summary (parse frontmatter for skills/agents)
- "Open file/folder" button
- "Open in editor" button (VS Code or platform default text editor)

Discover from all locations: user folder, project folder, `.claude` folders. For memories: show discovery source tree (project folder, user folder, .claude folder) or flat view with source annotation.

## Branch/Worktree Naming

Smart GitHub issue → branch/worktree name conversion. Strip filler words and conventional commit prefixes. Keep: issue number + concise description. Max ~5 words / ~50 characters.

## Per-Project Worktree Folders

Each project gets its own worktrees folder (not a shared worktrees folder for all projects).

## Quick Ideas Capture

Quick text box to paste raw ideas/requirements → append to `RAW_REQUIREMENTS.md` or similar.

## Chat UI for Agent Sessions

- Quick-navigate buttons to latest response start / latest prompt start
- Content before last prompt grayed out or visually distinct
- Input box always visible and accessible (no scrolling away from it during long sessions)
- Deterministic display of all sub-agents and tools used (parsed from JSON output/session log, not AI-generated summaries)

## Notification System

Sounds and/or window flash when user interaction required. All sounds configurable. Integration with `C:\_MP_github_cloned\peon-ping` for Warcraft-themed sounds.

# Grilling

Use `/mp-grill-me` to reach conclusions on any uncertain topic. Ask me anything.

# Output

1. Brainstorm and refine requirements (high-level focus)
2. Divide work into PRDs → create as GitHub issues via template from `/mp-requirements-to-prd`. Each PRD must be standalone with:
    - Complete list of what to explore, implement, take inspiration from
    - Specific repository and file references for each part
    - Related existing work and dependencies
3. Update documentation: `ARCHITECTURE.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `README.md`, `VOCABULARY.md` as needed, plus any affected open GitHub issues. Feel free to completely replace all the open issues and PRDs if necessary with new ones which will be properly defined and categorized

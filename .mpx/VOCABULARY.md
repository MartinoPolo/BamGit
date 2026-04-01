# BamGit Vocabulary

Canonical terms used across codebase, UI, docs, and conversation. Update this whenever a new concept emerges.

---

| Term          | Definition                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**     | The atomic unit of work. Linked to one GitHub issue, one worktree, one branch, one base branch. Can have many sessions over its lifetime. Has a color, priority, and state badges.                                               |
| **Dashboard** | A collection of issues. Two types: **repo dashboard** (one GitHub repo, issues = GitHub issues) and **portfolio dashboard** (group of projects, issues = individual repos).                                                      |
| **Session**   | One Claude Code (or other agent) CLI execution tied to an issue. Has a start/end, a transcript, tool calls, cost, and a state (running/needs-attention/idle/finished). Multiple sessions can exist per issue, even concurrently. |
| **Workspace** | The per-issue bundle of external tools: worktree folder, editor instance, terminal, dev server (port), browser tab. BamGit tracks and can launch/focus these.                                                                    |
| **Skill**     | A named Claude Code slash command (e.g., /mp-execute, /mp-review). Represented as a clickable button in the UI.                                                                                                                  |
| **Worktree**  | A git worktree checked out for an issue's branch. Created via setup-worktree.sh. One-to-one with an issue.                                                                                                                       |
| **Badge**     | A color-coded status indicator on an issue card. Types: branch status, PR state, GitHub issue state, sync/behind-base, merge conflict.                                                                                           |
| **Provider**  | An LLM agent CLI backend (Claude Code, GPT Codex, etc.). Each session runs on one provider.                                                                                                                                      |

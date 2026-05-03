# Sub-Agent Tree Panel — Design Spec

Design spec for the sub-agent tree sidebar panel shown in the session detail view. Displays the hierarchy of AI agents spawned during a session. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Generate Three Distinct Variants

Please generate three visual variants for the sub-agent tree panel. Each variant should explore a different approach to the tree visualization, node design, and inline expansion interaction. All variants must support all elements listed below. After I choose one, we will fully design all states.

## Panel Purpose

AI coding sessions can spawn sub-agents — nested AI sessions that handle subtasks (research, code review, file search, etc.). Users need to understand the agent hierarchy, see which sub-agents are active, and drill into any sub-agent's work. A typical session has 0-15 sub-agents, occasionally more. Nesting can go 3+ levels deep.

## Panel Location and Behavior

- Right sidebar of the session view
- Collapsible: toggle button to show/hide
- When collapsed: show a compact badge with agent count (e.g., "3 agents" or just a number with an icon)
- When expanded: approximately 260-300px wide
- Panel should not push the chat area — it overlays or the chat area shrinks

## Tree Display

### Root Node

- Represents the main session agent
- Shows: model name, session status, total tool count
- Always visible at top of panel (not collapsible)

### Sub-Agent Nodes

Each node in the tree represents a spawned sub-agent. Required info per node:

- **Agent name/description** — short text describing purpose (e.g., "Explore sessions module", "Review code quality")
- **Model** — which AI model (e.g., "Sonnet", "Haiku", "Opus")
- **Status indicator**:
  - Running: animated spinner or pulse
  - Completed: checkmark (success color)
  - Failed: X mark (danger color)
- **Tool usage count** — number of tools used by this agent (e.g., "12 tools")
- **Duration** — how long the agent ran (e.g., "45s", "2m 15s")
- **Collapse/expand toggle** — for nodes that have their own sub-agents

### Tree Structure

- Standard tree with indentation and connector lines (vertical + horizontal lines connecting parent to children)
- Unlimited depth — each level adds indentation
- Nodes at the same level aligned vertically
- Connector lines should be subtle (muted color, thin)

## Inline Expansion Interaction

When a user clicks a sub-agent node:

- The sub-agent's message history expands **inline in the main chat stream** at the point where the agent was spawned
- The expanded section has a **colored left border** (e.g., blue) to visually separate it from the parent chat
- Nested expansions use progressively different border colors or increasing indentation
- The expanded section contains: the sub-agent's prompt, its assistant responses, and its tool cards (Level 1/2 from the tool cards system)
- A "collapse" action closes the inline expansion

The tree panel node should visually indicate whether its messages are currently expanded in the chat (e.g., highlighted background, active indicator).

## Layout Constraints

- Panel width: 260-300px when expanded
- Nodes should be compact — each node approximately 48-64px tall
- Tree should scroll independently of the chat area
- Long agent names truncate with ellipsis
- Model names can be abbreviated (e.g., "Son." for Sonnet, "Hai." for Haiku)

## States to Explore in Variants

For the initial three variants, show a session with:
- Root agent (Opus, running, 45 tools)
  - Sub-agent 1 (Sonnet, completed, 12 tools, 23s) — "Explore codebase structure"
  - Sub-agent 2 (Sonnet, completed, 8 tools, 15s) — "Review error handling"
    - Nested sub-agent (Haiku, completed, 3 tools, 4s) — "Fetch library docs"
  - Sub-agent 3 (Sonnet, running, 5 tools, ongoing) — "Implement provider trait"
  - Sub-agent 4 (Haiku, failed, 2 tools, 8s) — "Run test suite"

After variant selection, we will design:
- Collapsed panel state (badge only)
- Empty state (no sub-agents spawned)
- Single agent (no tree needed, just root)
- Deep nesting (4+ levels)
- Many agents (15+ nodes, scrolling)
- Active expansion indicator (node's chat is expanded inline)
- Running vs completed vs failed visual treatments
- Hover and selection states

## Visual References

- c9watch's Subagents panel — compact list with status + drilldown
- OpenCovibe's nested sub-timeline — inline expansion with colored borders
- VS Code's file explorer tree — tree structure and indentation patterns
- Grovekeeper Forest Moss palette — the tree metaphor fits naturally with the forest theme

## Not Included in This Design

- The inline chat expansion content itself (uses chat message bubbles + tool cards from other briefs)
- The session metadata bar
- The chat input area
- The Files and Stats tabs

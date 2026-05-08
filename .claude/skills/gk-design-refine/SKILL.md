---
name: gk-design-refine
description: 'Refine a chosen design variant into the final HTML mockup, adopt components, and link to GitHub issue. Use when: "refine design", "accept variant", "polish design", "select variant", "create final mockup"'
argument-hint: '[variant-path or brief-path]'
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mkdir *), Bash(pnpm dlx shadcn-svelte*), Bash(gh *), Agent
metadata:
    author: MartinoPolo
    version: '0.1'
    category: design
---

# Design Refinement

Refine a chosen design variant (or a sufficiently specific brief) into the final polished HTML mockup. Adopt needed components, link to the GitHub issue.

## Process

### Step 1: Read Design System

Read `claude_design/DESIGN_SYSTEM.md` and `claude_design/tokens.css`.

### Step 2: Identify Source

- If given a variant path (e.g., `claude_design/mockups/variants/session-panel/variant-b.html`): use as the visual base.
- If given a brief path (or brief is specific enough for a single design): create directly from the brief.

Read the full design brief for all requirements, states, and edge cases.

### Step 3: Adopt Missing Components

If the design uses components not yet in `src/lib/components/ui/`:

1. Spawn `mp-context7-docs-fetcher` to look up the component in shadcn-svelte / Bits UI
2. Install: `pnpm dlx shadcn-svelte@latest add <name> --yes --overwrite`
3. Rename main `.svelte` file to PascalCase
4. Extract `<script module>` content to separate `.ts` file
5. Update `index.ts` imports
6. Create a Storybook story at `src/lib/components/ui/<name>/<Name>.stories.svelte`

### Step 4: Create Final Mockup

Output: `claude_design/mockups/<component-name>.html`

The final mockup must:

- Include **all states and edge cases** from the brief (not just the happy path)
- Inline the complete `tokens.css` in `<style>`
- Use design system classes (`gk-*`, `cb-*`) throughout
- Have higher fidelity than the variant — refined spacing, more realistic data, polished details
- Be self-contained and openable in any browser

### Step 5: Mark Brief as Completed

Rename the design brief to add underscore prefix:
`claude_design/design_briefs/COMPONENT_NAME.md` → `claude_design/design_briefs/_COMPONENT_NAME.md`

Add a reference line at the top of the brief:

```markdown
> **Final design**: `claude_design/mockups/<component-name>.html`
> **Adopted components**: [list any new components installed]
```

### Step 6: Link to GitHub Issue

Ask the user for the associated GitHub issue number (if not already known from context).

Add a comment to the issue:

```bash
gh issue comment <number> --body "## Design Finalized

Final mockup: \`claude_design/mockups/<component-name>.html\`
Design brief: \`claude_design/design_briefs/_COMPONENT_NAME.md\`
Components adopted: [list or 'none']

Open the HTML file in a browser to review. During implementation, reference the mockup and brief for exact specifications."
```

This ensures the implementation phase (which reads GitHub issue descriptions and comments) has a deterministic reference to the design.

### Step 7: Screenshot & Report

Screenshot the final mockup via Chrome DevTools MCP and present to the user.

Report:

- Final mockup path
- Components adopted (if any)
- GitHub issue comment link
- Brief marked as completed

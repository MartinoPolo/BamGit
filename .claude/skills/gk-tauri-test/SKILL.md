---
name: gk-tauri-test
description: 'Test and interact with the running Grovekeeper Tauri app via the Tauri MCP bridge. Loads tool schemas, connects to the app, applies workarounds for known MCP server bugs, and provides testing patterns. Use when: "test tauri", "tauri mcp test", "verify tauri bridge", "test the app", "gk tauri test", "interact with the app", "take screenshot"'
argument-hint: '[test description or area to test]'
allowed-tools: ToolSearch, Bash, Read, Grep, Glob, mcp__tauri__driver_session, mcp__tauri__webview_screenshot, mcp__tauri__webview_dom_snapshot, mcp__tauri__webview_execute_js, mcp__tauri__webview_interact, mcp__tauri__ipc_get_backend_state, mcp__tauri__read_logs
metadata:
    author: MartinoPolo
    version: '0.1'
    category: utility
---

# Tauri MCP Bridge Testing

Test and interact with the running Grovekeeper app through the Tauri MCP server (`@hypothesi/tauri-mcp-server` + `tauri-plugin-mcp-bridge`).

The app must be running via `pnpm tauri dev` in a separate terminal before invoking this skill.

## Step 1 — Load Deferred Tools

Use `ToolSearch` to load the Tauri MCP tools:

```
ToolSearch query: "select:mcp__tauri__driver_session,mcp__tauri__webview_screenshot,mcp__tauri__webview_dom_snapshot,mcp__tauri__webview_execute_js,mcp__tauri__webview_interact,mcp__tauri__ipc_get_backend_state,mcp__tauri__read_logs"
```

## Step 2 — Connect and Discover

1. Start a driver session: `mcp__tauri__driver_session` with `action: "start"`, `port: 9223`
2. Get backend state: `mcp__tauri__ipc_get_backend_state` — this returns the window list with labels
3. Store the window label from the response (Grovekeeper currently uses `"overview"`)
4. Pass this `windowId` on **every** subsequent webview tool call

## Step 3 — Fix Accessibility Snapshots

Run this via `mcp__tauri__webview_execute_js` (with the discovered windowId):

```javascript
(async () => {
	return await window.__TAURI__.core.invoke('plugin:mcp-bridge|request_script_injection');
})();
```

This injects the aria-api library that the MCP server registers but fails to inject. See [REFERENCE.md](REFERENCE.md) for details.

## Step 4 — Execute User's Test Request

Use the patterns below. For detailed workarounds and known issues, see [REFERENCE.md](REFERENCE.md).

### Taking Screenshots

`mcp__tauri__webview_screenshot` with `windowId`, `format: "png"`

### Reading the UI

- **Structure snapshot**: `mcp__tauri__webview_dom_snapshot` with `type: "structure"` — gives DOM tree with ref IDs
- **Accessibility snapshot**: `mcp__tauri__webview_dom_snapshot` with `type: "accessibility"` — gives semantic roles, names, states (requires Step 3)
- Each element gets a `[ref=eN]` ID that can be used with other tools until the next snapshot

### Calling Rust Backend Commands

Use `mcp__tauri__webview_execute_js` with an async IIFE:

```javascript
(async () => {
	const result = await window.__TAURI__.core.invoke('command_name', { argName: value });
	return result;
})();
```

To discover available commands, search `src-tauri/src/commands/` for `#[tauri::command]` functions.

### Interacting with UI Elements

`mcp__tauri__webview_interact` with `windowId` and:

- `strategy: "text"`, `selector: "Button Text"` — find by visible text
- `strategy: "css"`, `selector: ".my-class"` — find by CSS selector
- `selector: "ref=e14"` — use ref ID from a prior dom snapshot

Supported actions: `click`, `double-click`, `long-press`, `scroll`, `swipe`, `focus`

### Reading Console Logs

`mcp__tauri__read_logs` with `source: "console"`, `windowId`, optional `filter` regex.

## Step 5 — Report Results

After completing the test, summarize:

- What was tested and the outcome (pass/fail)
- Screenshots taken (describe what's visible)
- Any errors encountered with context
- Suggestions for follow-up if issues were found

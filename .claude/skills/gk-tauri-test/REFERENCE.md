# Tauri MCP Bridge — Known Issues & Workarounds

Reference material for the `gk-tauri-test` skill. Findings from testing `@hypothesi/tauri-mcp-server` with `tauri-plugin-mcp-bridge`.

## Known Issues

### 1. `ipc_execute_command` Is Not Implemented

**Symptom**: Every call returns `"Unsupported Tauri command: <name>"`.

**Root cause**: The Rust handler (`execute_command.rs` in the bridge plugin) is a stub. It always returns an error with "Dynamic command execution not yet implemented." The API docs claim it "executes any Tauri IPC command directly" — this is misleading.

**Workaround**: Use `mcp__tauri__webview_execute_js` with `window.__TAURI__.core.invoke()`:

```javascript
(async () => {
	const { invoke } = window.__TAURI__.core;
	const result = await invoke('get_dashboards', { includeArchived: false });
	return result;
})();
```

This has full access to every registered Tauri command via the standard IPC path.

### 2. Accessibility Snapshots Fail ("aria-api library not loaded")

**Symptom**: `webview_dom_snapshot` with `type: "accessibility"` throws `"aria-api library not loaded"`.

**Root cause**: The MCP server's `registerScript()` adds the aria-api bundle to the bridge's in-memory `ScriptRegistry` but never sends a follow-up `execute_js` to inject it into the webview. The bridge only injects registered scripts on page navigation events (`popstate`, initial load). Since the aria-api is registered _after_ page load (on first accessibility snapshot request), it sits in the registry without being injected.

**Verification**: Call `request_script_injection` from the webview — it returns the aria-api as one of the registered-but-not-injected scripts:

```javascript
(async () => {
	return await window.__TAURI__.core.invoke('plugin:mcp-bridge|request_script_injection');
})();
// Returns: { injected: 3, scriptIds: ["__mcp_aria_api__", "__mcp_resolve_ref__", "__mcp_html2canvas__"] }
```

**Workaround**: Run the above `request_script_injection` call once per session before using accessibility snapshots. After injection, accessibility snapshots work perfectly, returning WAI-ARIA roles, names, states, and ref IDs.

**Alternative**: Use `type: "structure"` instead — it works without aria-api and is sufficient for most automation (gives tag names, classes, IDs, ref IDs).

### 3. Window Label Defaults to "main"

**Symptom**: Tools fail with `"Window 'main' not found"` when `windowId` is omitted.

**Root cause**: All webview tools default `windowId` to `"main"`. Grovekeeper's window is labeled `"overview"` (configured in `tauri.conf.json`).

**Workaround**: Always pass `windowId` explicitly. Discover the correct label from `ipc_get_backend_state`, which returns:

```json
{
	"windows": [{ "label": "overview", "title": "Grovekeeper", "visible": true, "focused": true }]
}
```

### 4. `read_logs` System Source Fails on Windows

**Symptom**: `source: "system"` returns `"'log' is not recognized as an internal or external command"`.

**Root cause**: The implementation uses macOS's `log show` command, which doesn't exist on Windows.

**Workaround**: Use `source: "console"` for webview JavaScript logs. System-level Rust/Tauri logs are not accessible via MCP on Windows.

## Tool Reliability Matrix

| Tool                                   | Status                 | Notes                                                     |
| -------------------------------------- | ---------------------- | --------------------------------------------------------- |
| `driver_session`                       | Works                  | Reliable WebSocket connection on port 9223                |
| `webview_screenshot`                   | Works                  | Native WebView2 API on Windows; requires correct windowId |
| `webview_dom_snapshot` (structure)     | Works                  | Returns DOM tree with ref IDs; no dependencies            |
| `webview_dom_snapshot` (accessibility) | Works after workaround | Requires manual `request_script_injection` first          |
| `webview_execute_js`                   | Works                  | Full `window.__TAURI__` access; use for IPC commands      |
| `webview_interact`                     | Works                  | Click, scroll, focus via text/css/ref selectors           |
| `ipc_get_backend_state`                | Works                  | Returns app metadata, Tauri version, window list          |
| `ipc_execute_command`                  | Broken                 | Stub implementation; use `webview_execute_js` instead     |
| `ipc_emit_event`                       | Untested               | Should work for event system testing                      |
| `ipc_monitor` / `ipc_get_captured`     | Untested               | Should work for IPC traffic debugging                     |
| `read_logs` (console)                  | Works                  | Webview JS logs with optional regex filter                |
| `read_logs` (system)                   | Broken on Windows      | Uses macOS-only `log show` command                        |

## Testing Patterns

### Verify a Rust Command Returns Expected Data

```javascript
// via webview_execute_js
(async () => {
	const dashboards = await window.__TAURI__.core.invoke('get_dashboards', {
		includeArchived: false,
	});
	return { count: dashboards.length, names: dashboards.map((d) => d.name) };
})();
```

### Interact With a Button and Verify State Change

1. Take a `structure` snapshot to find the button's ref ID
2. Click it: `webview_interact` with `action: "click"`, `selector: "ref=eN"`
3. Take a screenshot to verify the visual result
4. Take another snapshot to verify DOM changes

### Test a Form Flow

1. Snapshot to find form elements
2. Use `webview_execute_js` to fill inputs (more reliable than interact for text):
    ```javascript
    (() => {
    	const input = document.querySelector('input[name="field"]');
    	const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    		window.HTMLInputElement.prototype,
    		'value',
    	).set;
    	nativeInputValueSetter.call(input, 'new value');
    	input.dispatchEvent(new Event('input', { bubbles: true }));
    })();
    ```
3. Click submit via `webview_interact`
4. Screenshot to verify result

### Check Accessibility of a Component

1. Run the aria-api injection workaround (Step 3 in SKILL.md)
2. Take an accessibility snapshot scoped to the component:
    ```
    webview_dom_snapshot type: "accessibility", selector: ".component-class", windowId: "overview"
    ```
3. Verify roles, names, and states match expectations

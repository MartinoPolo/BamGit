# $effect Anti-Pattern Reference

Detection heuristics and fix templates for each anti-pattern.

## E1: circular-sync

**What**: Two or more `$effect` blocks where each writes to a `$state` variable that the other reads.

**Detection**: Find pairs of effects where effect A writes to variable X and reads variable Y, while effect B writes to Y and reads X.

**Example (bad)**:

```svelte
let spent = $state(0);
let left = $state(total);
$effect(() => { left = total - spent; });
$effect(() => { spent = total - left; });
```

**Fix**: Replace with `$derived` + function binding:

```svelte
let spent = $state(0);
let left = $derived(total - spent);
function updateLeft(newLeft) { spent = total - newLeft; }
```

**Confidence**: high — the circular pattern is unambiguous.

---

## E2: derived-via-effect

**What**: `$effect` that only computes a value from reactive dependencies and assigns it to a `$state` variable. The effect body is pure computation with no side effects (no DOM manipulation, no async, no subscriptions).

**Detection**: Effect body contains only assignment(s) to `$state` variables using expressions derived from other reactive values. No `addEventListener`, `setInterval`, `setTimeout`, `fetch`, `await`, DOM access, or cleanup return.

**Example (bad)**:

```svelte
let count = $state(0);
let doubled = $state(0);
$effect(() => { doubled = count * 2; });
```

**Fix**: Replace with `$derived`:

```svelte
let count = $state(0); let doubled = $derived(count * 2);
```

For complex logic, use `$derived.by`:

```svelte
let result = $derived.by(() => {
    // complex computation
    return computedValue;
});
```

**Confidence**: high when the effect body is purely computational. Medium if it also has side effects mixed in (needs splitting).

---

## E3: state-update-in-effect

**What**: `$effect` that assigns to `$state` variables as part of broader side-effect logic (not pure derivation — that's E2). Examples: updating state after a fetch, setting state based on DOM measurements.

**Detection**: Effect body assigns to `$state` variables AND contains side effects (fetch, DOM access, timers, etc). Unlike E2, the state update is a secondary action alongside a primary side effect.

**Assessment**: Sometimes legitimate (e.g., updating loading state after async fetch). Flag for review.

**Example (suspicious)**:

```svelte
let data = $state(null);
$effect(() => {
    fetch('/api').then(r => r.json()).then(d => { data = d; });
});
```

**Guidance**: Consider whether the state update can be moved to an event handler, a load function, or a derived value. If the effect genuinely needs to write state (e.g., syncing with an external system), document why with a comment.

**Confidence**: medium — context-dependent.

---

## W1: missing-cleanup

**What**: `$effect` that sets up a resource (interval, timeout, event listener, subscription, observer) without returning a teardown function.

**Detection**: Effect body calls one of:

- `setInterval` / `setTimeout`
- `addEventListener`
- `.subscribe(` / `.on(`
- `new MutationObserver` / `new IntersectionObserver` / `new ResizeObserver`
- `requestAnimationFrame`

AND the effect does not return a function.

**Example (bad)**:

```svelte
$effect(() => {
    const id = setInterval(() => count++, 1000);
});
```

**Fix**: Return cleanup:

```svelte
$effect(() => {
    const id = setInterval(() => count++, 1000);
    return () => clearInterval(id);
});
```

Cleanup map:
| Setup | Cleanup |
|-------|---------|
| `setInterval(fn, ms)` | `clearInterval(id)` |
| `setTimeout(fn, ms)` | `clearTimeout(id)` |
| `el.addEventListener(ev, fn)` | `el.removeEventListener(ev, fn)` |
| `.subscribe(fn)` | call returned unsubscribe |
| `new MutationObserver(fn)` | `observer.disconnect()` |
| `new IntersectionObserver(fn)` | `observer.disconnect()` |
| `new ResizeObserver(fn)` | `observer.disconnect()` |
| `requestAnimationFrame(fn)` | `cancelAnimationFrame(id)` |

**Confidence**: medium — some setups (e.g., one-shot setTimeout) may intentionally skip cleanup. High if `setInterval` or `addEventListener` without cleanup.

---

## W2: browser-guard

**What**: `if (browser)` or `if (typeof window !== 'undefined')` wrapping the contents of an `$effect` body. Effects only run in the browser — the guard is redundant.

**Detection**: Effect body starts with or is entirely wrapped in:

- `if (browser)`
- `if (typeof window !== 'undefined')`
- `if (typeof document !== 'undefined')`

**Example (bad)**:

```svelte
$effect(() => {
    if (browser) {
        document.title = `Count: ${count}`;
    }
});
```

**Fix**: Remove the guard:

```svelte
$effect(() => {
    document.title = `Count: ${count}`;
});
```

**Confidence**: high — always redundant per Svelte docs.

---

## W3: logging-without-inspect

**What**: `console.log` / `console.debug` / `console.info` inside `$effect` for debugging reactive values. Svelte provides `$inspect` for this purpose.

**Detection**: Effect body contains `console.log`, `console.debug`, or `console.info` calls that log reactive values.

**Example (bad)**:

```svelte
$effect(() => {
    console.log('count changed:', count);
});
```

**Fix**: Replace with `$inspect`:

```svelte
$inspect(count);
```

For multiple values:

```svelte
$inspect(count, name, items);
```

For custom formatting use `.with()`:

```svelte
$inspect(count).with(console.trace);
```

**Confidence**: high when the entire effect is just logging. Medium if logging is mixed with other side effects (only the logging portion should move to `$inspect`, not the whole effect).

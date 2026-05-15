# Lessons Learned

Architectural insights and hard-won knowledge. Prevents re-learning mistakes.

## Deep Module Architecture Rewrite

### ts-rs type generation

- `serde-compat` feature is essential — without it, `#[serde(rename_all = "kebab-case")]` and `#[serde(tag = "type")]` attributes are ignored, producing wrong TypeScript types.
- `#[ts(type = "number")]` must be added to every `i64`/`u64` field — JavaScript has no 64-bit integers, and ts-rs defaults to `bigint` which breaks JSON serialization from Tauri.
- Generated types should be excluded from all linters/formatters (eslint, oxlint, prettier, stylelint, fallow) via ignore patterns.
- Running `cargo test` triggers type generation. There is no separate generation command.

### r2d2 connection pool

- WAL mode must be set on every connection individually (read pool + write conn + actor connections). It's a per-connection pragma, not a database-level setting.
- `r2d2_sqlite` version must match the `rusqlite` version exactly (e.g., `r2d2_sqlite = "0.24"` for `rusqlite = "0.31"`).
- Session actor connections must remain independent from the pool — they run in separate tokio tasks and would compete for pool slots.

### Svelte 5 deep modules

- `SvelteMap` instances in `$state()` must be declared with `SvelteMap` as the type parameter, not plain `Map`. A plain `new Map()` initial value won't be reactive for reads before the first mutation.
- `createContext()` (Svelte 5.40+) is cleaner than the `setContext`/`getContext` key-string pattern. The `[use*, set*]` destructured pair provides type safety without manual key management.
- Event listeners set up in `onMount` with `await listen()` can leak if the component is destroyed before the Promise resolves. An `AbortController`-style cancelled flag is needed for robust cleanup.

### Migration strategy

- SQLite CHECK constraint changes require table recreation — `ALTER TABLE` can't modify constraints. Use `PRAGMA foreign_keys = OFF` → `BEGIN` → create new table → copy data → drop old → rename → `COMMIT` → `PRAGMA foreign_keys = ON`.
- Always re-enable `foreign_keys` in a guard pattern (even if the migration failed) to avoid leaving the database in an inconsistent state.

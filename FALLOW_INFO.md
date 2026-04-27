# Fallow — Code Quality Tool

Fallow is a Rust-native codebase intelligence tool replacing knip for dead code detection.
Config: `.fallowrc.json` | Cache: `.fallow/` (gitignored) | Baseline: `fallow-baselines/dead-code-regression.json`

## Pre-commit hook (every `git commit`)

Triggered by husky → lint-staged on staged files only:

| Staged file pattern         | Commands                               |
| --------------------------- | -------------------------------------- |
| `*.{js,mjs,ts,svelte}`      | `oxlint --fix` then `prettier --write` |
| `*.{css,json,md,html,yaml}` | `prettier --write`                     |

Simulate:

```bash
pnpm exec oxlint --fix
pnpm exec prettier --write .
```

## `check:all` (manual + CI)

Runs during CI and via `pnpm check:all`. Sequential, fails on first error:

| Order | Command                                   | What it does                                                   |
| ----- | ----------------------------------------- | -------------------------------------------------------------- |
| 1     | `svelte-kit sync`                         | Generate types (`$lib`, route types)                           |
| 2     | `prettier --write .`                      | Format everything                                              |
| 3     | `oxlint`                                  | Fast Rust linter (curly rule)                                  |
| 4     | `eslint .`                                | Full TS/Svelte lint (naming, type-checked)                     |
| 5     | `stylelint "src/**/*.{css,svelte}"`       | CSS lint (Tailwind v4 aware)                                   |
| 6     | `fallow dead-code`                        | Dead code: unused files/deps/imports=error, exports/types=warn |
| 7     | `svelte-check --tsconfig ./tsconfig.json` | TypeScript + Svelte type checking                              |

Simulate each step individually:

```bash
pnpm exec oxlint
pnpm exec eslint .
pnpm exec stylelint "src/**/*.{css,svelte}"
pnpm exec fallow dead-code
pnpm exec svelte-check --tsconfig ./tsconfig.json
```

## CI pipeline (push/PR to `dev` or `main`)

| Order | Step                                        | Fails build?  |
| ----- | ------------------------------------------- | ------------- |
| 1     | `pnpm install --frozen-lockfile`            | Yes           |
| 2     | `pnpm check:all` (all 7 commands above)     | Yes           |
| 3     | `pnpm exec fallow health --score --summary` | No (advisory) |
| 4     | `pnpm test -- --coverage`                   | Yes           |
| 5     | `pnpm test:e2e`                             | Yes           |

Simulate full CI locally:

```bash
pnpm check:all
pnpm exec fallow health --score --summary
pnpm test -- --coverage
pnpm test:e2e
```

## Fallow-specific commands (manual/exploratory)

Not part of any automated pipeline — run for insight:

```bash
# Dead code analysis (what check:all runs)
pnpm exec fallow dead-code

# Health score + complexity hotspots
pnpm exec fallow health --score --summary

# Top 20 most complex functions
pnpm exec fallow health --top 20

# Code duplication
pnpm exec fallow dupes

# Everything at once
pnpm exec fallow

# Update regression baseline after cleaning up dead code
pnpm exec fallow dead-code --save-regression-baseline fallow-baselines/dead-code-regression.json
```

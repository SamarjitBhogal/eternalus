# Guardrails

Every rule that matters is enforced by **git hooks and CI**, which apply to every human and every
AI tool on macOS, Linux and Windows. Everything else is policy, checked in review.

## 1. Guardrail table

| Guardrail                  | Enforces                                                                                                                                           | Tool                                               | Configured in                                                      | What a failure looks like                                                                   | How to fix it properly                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Strict TypeScript          | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, no implicit returns/overrides, no unused locals/params, `verbatimModuleSyntax` | `tsc -b`                                           | `tsconfig.base.json`, per-package `tsconfig*.json`                 | `error TS2532: Object is possibly 'undefined'`                                              | Handle the case (narrow, default, early return). Never cast it away   |
| core has no platform types | No DOM/Node globals in core                                                                                                                        | `tsc`                                              | `packages/core/tsconfig.json` (`lib: ES2023`, `types: []`)         | `Cannot find name 'window'`                                                                 | Move the code to the client, or pass the data in                      |
| No `any` / unsafe          | `no-explicit-any`, `no-unsafe-*`                                                                                                                   | ESLint (`strictTypeChecked`)                       | `eslint.config.js`                                                 | `Unexpected any. Specify a different type`                                                  | Use `unknown` and narrow, or write the real type                      |
| ts-comments                | `@ts-ignore`/`@ts-nocheck` banned; `@ts-expect-error` needs a description                                                                          | ESLint `ban-ts-comment` (from `strictTypeChecked`) | `eslint.config.js`                                                 | `Use "@ts-expect-error" instead of "@ts-ignore"`                                            | Fix the type error                                                    |
| Zero warnings              | Any lint warning fails the run                                                                                                                     | ESLint `--max-warnings 0`                          | `package.json` (`lint` script)                                     | Any lint output fails                                                                       | Fix the finding                                                       |
| Test integrity             | No `.only`/`.skip`; every test asserts                                                                                                             | ESLint `@vitest/eslint-plugin` (recommended)       | `eslint.config.js`                                                 | `Focused tests are not allowed` / `Test has no assertions`                                  | Remove the modifier; add a real assertion                             |
| Core imports               | core never imports React, Redux or the client                                                                                                      | ESLint `no-restricted-imports`                     | `eslint.config.js`                                                 | `'react' import is restricted from being used by a pattern`                                 | Move the code to the client                                           |
| Determinism                | No `Math.random` in core; no DOM/Node timers (tsconfig)                                                                                            | ESLint `no-restricted-properties`, `tsc`           | `eslint.config.js`, `packages/core/tsconfig.json`                  | `'Math.random' is restricted ... use a seeded RNG`                                          | Use a seeded RNG; measure time in ticks                               |
| Dead code                  | Unused files, exports, types, deps, devDeps, unlisted deps                                                                                         | knip                                               | `knip.json`                                                        | `Unused exports (1) foo  src/bar.ts`                                                        | Delete it or use it. Don't export "just in case"                      |
| Formatting                 | One style, LF line endings                                                                                                                         | Prettier, git                                      | `.prettierrc`, `.prettierignore`, `.gitattributes`                 | `[warn] src/x.ts` / `Code style issues found`                                               | `npm run format`                                                      |
| Coverage ratchet           | Minimum coverage per package                                                                                                                       | Vitest V8 coverage                                 | `packages/core/vitest.config.ts`, `apps/client/vitest.config.ts`   | `ERROR: Coverage for lines (78%) does not meet global threshold (80%)`                      | Add tests. Never lower the threshold                                  |
| Pre-commit / pre-push      | `npm run check:quick` (typecheck + lint) on the whole project                                                                                      | git hooks (`core.hooksPath`)                       | `.githooks/pre-commit`, `.githooks/pre-push`, `check:quick` script | `[pre-commit] BLOCKED: npm run check:quick failed.`                                         | Run the named command and fix the errors                              |
| CI gate                    | `npm run check` on Linux, macOS and Windows, one named step per tool                                                                               | GitHub Actions                                     | `.github/workflows/ci.yml`                                         | Red step, e.g. "Lint (eslint, zero warnings)"                                               | Reproduce locally with the same npm script                            |
| Lockfile in sync           | `npm ci` fails if `package-lock.json` doesn't match `package.json`                                                                                 | npm (CI install step)                              | `.github/workflows/ci.yml`                                         | `npm ci can only install packages when your package.json and package-lock.json are in sync` | Run `npm install` and commit both files; never hand-edit the lockfile |
| Exact versions / engines   | `save-exact`, `engine-strict`, `packageManager`                                                                                                    | npm                                                | `.npmrc`, `package.json`                                           | `EBADENGINE Unsupported engine`                                                             | Switch to the Node version in `.nvmrc`                                |

## 2. Coverage ratchet

Coverage thresholds live in each package's `vitest.config.ts`. **They may only go up.**

- `core`: 80% for lines, branches, functions and statements.
- `client`: 45% lines, functions and statements, 50% branches, because Canvas and React-mounting
  code are hard to unit test in Node. Raise it as tests are added.
- Both packages currently have one placeholder test each (`packages/core/src/index.test.ts`,
  `apps/client/src/game/GameCanvas.test.tsx`) so the gate runs; replace them with real tests.
- When coverage rises well above a threshold, raise the threshold in the same PR.
- A PR that lowers a threshold is rejected in review.

## 3. Hooks, bypassing and cross-platform notes

- Hooks are plain git hooks in `.githooks/`, no extra package. `npm install` runs the `prepare`
  script, `git config core.hooksPath .githooks`, so git runs them. If hooks don't run (e.g. you
  never ran `npm install`), run `npm run prepare` once.
- `pre-commit` and `pre-push` both run `npm run check:quick`. To change what they run, edit the
  `check:quick` script (one place), not the hook files.
- **`--no-verify` is forbidden for humans and agents.** CI runs a superset of the hook checks, so
  bypassing only moves the failure later.
- Hooks are POSIX `sh` scripts (`#!/bin/sh`) and must stay executable (`git update-index
--chmod=+x .githooks/<hook>` if you add one from Windows). On Windows they run in the Git Bash
  shell that ships with Git for Windows, whichever terminal you commit from.
- Line endings are always **LF** (macOS/Linux style), on every OS. `.gitattributes`
  (`* text=auto eol=lf`) makes git store and check out LF even on Windows, and Prettier's
  `"endOfLine": "lf"` makes `format:check` fail on any CRLF file. If your editor writes CRLF,
  run `npm run format`.
- npm scripts use only `&&` chaining and cross-platform tools; never add shell-specific syntax
  (`rm -rf`, `export`, single-quoted arguments) to `package.json` scripts. Use a Node script
  instead.
- **Planned change:** upgrade `pre-push` to the full `npm run check` once the team agrees.

## 4. Changing a guardrail

1. Explain the problem the guardrail causes, with a concrete example.
2. Write an ADR in `docs/decisions/` (copy `0000-template.md`): context, decision, consequences.
3. Open a PR containing the ADR and the config change. Update this file's table in the same PR.
4. A maintainer reviews and approves.
5. Loosening a rule needs a stronger justification than tightening one. Coverage thresholds only
   go up.

Agents never do this on their own. If a guardrail blocks a task, the agent stops, explains why,
and a human decides.

## 5. Manual setup (humans, on GitHub)

These can't be configured from files in the repo. A repository admin should set up a branch
protection rule (or ruleset) for `main`:

- Require a pull request before merging, with 1 approval.
- Require the CI status checks to pass (`npm run check (ubuntu-latest)`, `(macos-latest)`,
  `(windows-latest)`).
- Block force pushes and deletions.
- Require linear history; allow squash merge only.

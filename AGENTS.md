# AGENTS.md

Rules for every AI coding agent (and human) working in this repository. This file is the single
source of agent instructions. Tool-specific files (e.g. `CLAUDE.md`) only point
here. Package rules live in `packages/core/AGENTS.md` and `apps/client/AGENTS.md`;
read the one nearest to the files you edit.

Eternalus is a browser-only 2D game: TypeScript monorepo, custom Canvas 2D engine, React UI,
single player vs. AI bots, no server. **The repo is scaffolding only:** the client renders an
empty canvas inside a Redux provider and core has no code yet. The architecture below is the
plan; follow it when adding code.

## Definition of done

1. Run `npm run check:quick` (typecheck + lint) after each meaningful edit.
2. Run `npm run check` before declaring a task done, and report the result verbatim.
3. A task with any failing check is **not done**. Say so; do not hide or work around it.

## Git: never commit or push unless asked

- **Do not run `git commit`, `git push`, `git merge`, `git rebase` or `git tag` unless the
  human explicitly asks for it in the current task.** Leave changes uncommitted in the working
  tree for the human to review. Permission given for one task does not carry over to the next.
- When asked to commit: use Conventional Commits with an allowed scope (below), keep commits
  small, work on a branch (`feat/`, `fix/`, `docs/`, `refactor/`, `chore/` + short name), never
  on `main`.
- Never use `--no-verify`, `git push --force`, `git reset --hard`, or delete branches.
- Commit scopes: `core`, `client`, `ui`, `engine`, `bridge`, `ai`, `tooling`, `ci`, `docs`, `deps`.
  Example: `feat(core): add health system`.
- One task per branch. Parallel agents each use their own branch and git worktree
  (see `docs/agent-workflow.md`).

## Forbidden actions

- Never weaken a guardrail to make a check pass. That means no:
  - `eslint-disable` without naming the rule and giving a `-- reason`,
  - `@ts-ignore` / `@ts-nocheck`, or `any`,
  - skipped (`.skip`, `.only`, `.todo`) or deleted tests, or weakened assertions,
  - lowered coverage thresholds.
- If a guardrail blocks a legitimate change, **stop and explain why**. A human decides whether
  to change it through an ADR in `docs/decisions/`.
- No new dependencies without explicit human approval. Never hand-edit `package-lock.json`.
- Stay in scope: change only what the task needs. No drive-by refactors, renames, or
  reformatting of untouched files.
- Never invent library APIs. Check the installed types in `node_modules` first.
- Never make product or game-design decisions. If requirements are unclear, ask.
- Never add copyrighted assets (images, sounds, fonts) the team has no licence for.

## Architecture (planned; full version: `docs/architecture.md`)

1. `packages/core` (`@eternalus/core`) is the simulation: pure TypeScript. No React, DOM, Canvas
   or Node APIs.
2. Dependencies point `client → core` only.
3. Import core only as `@eternalus/core`, never a deep path.
4. No import cycles.
5. `apps/client/src/ui/` imports only from `bridge/`, `ui/`, `styles/`. Never `game/` or core.
6. `game/views/` only reads snapshots (`import type` from core) and draws through `Renderer`.
7. Only `game/engine/Renderer.ts` touches the Canvas 2D context.
8. core never uses `Math.random`, `Date`, `performance.now`, `setTimeout` or `setInterval`.
   Use a seeded RNG and tick counts.
9. The simulation advances in fixed ticks (30/s). Input and bots produce `Command`s, applied
   on the next tick.
10. Game state is the single source of truth. React shows throttled snapshots via the store.
11. Tuning numbers and display names live in `packages/core/src/content/`, looked up by ID.
12. Systems talk through typed `GameEvents`, never by calling each other.

TypeScript and ESLint catch parts of rules 1–3 and 8; everything else is checked in review.

## Where code goes

| Code                                  | Location                                       |
| ------------------------------------- | ---------------------------------------------- |
| Game rules, entities, systems, bots   | `packages/core/src/`                           |
| Tuning numbers, display names         | `packages/core/src/content/`                   |
| Loop, renderer, camera, asset loading | `apps/client/src/game/engine/`                 |
| Drawing game objects                  | `apps/client/src/game/views/`                  |
| Keyboard/mouse → Commands             | `apps/client/src/game/input/`                  |
| Menus, HUD, reusable React pieces     | `apps/client/src/ui/{screens,hud,components}/` |
| Game ↔ React events and store         | `apps/client/src/bridge/`                      |

If nothing fits, propose a location and ask. Do not invent new top-level folders.

## Coding standards (full version: `CONTRIBUTING.md`)

- No `any`: use `unknown` and narrow. `type` for data shapes, `interface` for contracts that
  classes implement. String-literal unions, never `enum`. `readonly` by default.
- Naming: `PascalCase` classes/types/components, `camelCase` functions/variables,
  `SCREAMING_SNAKE_CASE` constants, `kebab-case` content IDs (never renamed once used),
  booleans prefixed `is/has/can/should/was`.
- Files: each class has a single purpose and its file (`MovementSystem.ts`) contains **only that
  class**. Put the class's custom types in `MovementSystem.types.ts` and its constants in
  `MovementSystem.constants.ts`, next to it (only when needed). Details: `CONTRIBUTING.md` §3.1.
  Other files `camelCase.ts`; React components `PascalCase.tsx` with a co-located
  `PascalCase.module.css`.
- TSDoc on every exported class and public method.
- No magic numbers in gameplay code (put them in `content/`, mark provisional ones `// TUNE:`).
- No commented-out code. TODOs need an owner: `// TODO(name): description`.
- Never use `console` in app code (lint fails).
- Keep files short (~300 lines) and functions small (~60 lines); split them when they grow.

## Testing

- Every behaviour change comes with tests. Every bug fix comes with a test that failed before it.
- Tests sit next to the file they test in `src/`, named `<name>.test.ts(x)`
  (e.g. `MovementSystem.ts` + `MovementSystem.test.ts`).
- Tests are deterministic: seed any randomness, and advance time only by stepping the
  simulation or a fake frame scheduler, never with real timers.
- Every test asserts something. Coverage thresholds only ever go up.

## Commands

`npm run check` (everything, same as CI) · `npm run check:quick` · `npm run test` ·
`npm run lint` · `npm run typecheck` · `npm run knip` ·
`npm run format`. Full list: `README.md`.

# AGENTS.md

Rules for every AI coding agent (and human) working in this repository. This file is the single
source of agent instructions. Tool-specific files (`CLAUDE.md`, `GEMINI.md`,
`.github/copilot-instructions.md`) only point here. Package rules live in
`packages/core/AGENTS.md` and `apps/client/AGENTS.md`; read the one nearest to the files you edit.

Eternalus is a browser-only 2D game: TypeScript monorepo, custom Canvas 2D engine, React UI,
single player vs. AI bots, no server. **The architecture below is the target design:**
`docs/plan/` tracks how much of it is built. Follow the design when adding code.

## Read first (in this order)

1. This file, then the nearest package `AGENTS.md`.
2. `docs/architecture/02-code-structure.md`, then the architecture doc whose `paths:`
   frontmatter matches the files you will touch (`docs/architecture/README.md` lists them).
3. The current phase doc in `docs/plan/` and the last entry of `docs/plan/PROGRESS.md`.
4. Your task brief (issue, prompt, or an open item in `INBOX.md`).

Full documentation map: `docs/README.md`. Recipes for adding things: `docs/architecture/17-extension-recipes.md`.
Skills (`.claude/skills/`, mirrored in `.agents/skills/`): `new-entity`, `new-system`,
`new-ability`, `new-screen`, `new-content`, `pr-review`, `doc-gardening`, `verify`, `adr`.

## Definition of done

1. Run `npm run check:quick` (typecheck + lint) after each meaningful edit.
2. Run `npm run check` before declaring a task done, and report the result verbatim.
3. A task with any failing check is **not done**. Say so; do not hide or work around it.
4. Append an entry to `docs/plan/PROGRESS.md` (date, phase/sprint, branch, what, checks, next).

## Before opening a PR (pre-PR gate, ADR 0010)

After everything in the Definition of done, never instead of it, and in this order:

1. **Critic.** An independent reviewer (the `architecture-reviewer` subagent, not your session)
   gets only the branch, its base commit and the governing docs **as they stood at the base
   commit**, not your reasoning. Each difference between code and design is a **violation**
   (rework, re-run the critic until no blockers), **acceptable** (forced by a binding contract or
   an allowed interim stand-in; note it in the PR) or **better than the design** (tell the human
   in chat and add it to `INBOX.md`; once signed off, update the design docs in the same PR).
2. **Ponytail.** `/ponytail-review` on the branch diff, then apply the accepted cuts with
   `/ponytail`. Architecture and ADRs outrank ponytail (see "Ponytail" below); tests are never
   deleted or weakened.
3. **Re-check.** `npm run check` again on the post-ponytail code, result reported verbatim. If
   ponytail changed structure, not just lines, the critic re-checks that diff.
4. **Open the PR** only when all of the above pass; its description records the critic verdict,
   the ponytail cuts and the final check output.

Tools without the ponytail plugin stop after the Definition of done and hand the branch to a
Claude Code session for the gate.

## Ponytail (ADR 0010)

The `ponytail@ponytail` Claude Code plugin runs at level **lite** in this repo
(`.claude/settings.json`). Its hooks inject the ruleset into the main session and into the coding
subagents those settings list; the `architecture-reviewer` and `doc-gardener` subagents run
without it. Its ladder (does this need to exist, reuse what is here, root-cause fixes, no new
dependencies) applies. Where it conflicts with this file or an ADR, **the architecture wins**:
ports with one implementation, strategies and registries, numbers in `content/`/`config/`,
companion files, TSDoc and validation at boundaries stay. A ponytail cut that would change the
design is raised as a better-than-design item, not applied. `ponytail:` comments mark deliberate
shortcuts (name the ceiling and the upgrade path); `/ponytail-debt` and `/ponytail-audit` run at
phase exit.

## Git: never commit or push unless asked

- **Do not run `git commit`, `git push`, `git merge`, `git rebase` or `git tag` unless the
  human explicitly asks for it in the current task.** Leave changes uncommitted in the working
  tree for the human to review. Permission given for one task does not carry over to the next.
- When asked to commit: use Conventional Commits with an allowed scope (below), keep commits
  small, work on a task branch (`feat/`, `fix/`, `docs/`, `refactor/`, `chore/` + short name)
  created from the current **phase branch** (`phase/<n>-<name>`), never on `main`. Phase
  branches merge into `main` by one PR per phase (`docs/process/git-workflow.md`).
- Never use `--no-verify`, `git push --force`, `git reset --hard`, or delete branches.
- Commit scopes: `core`, `client`, `ui`, `engine`, `bridge`, `ai`, `tooling`, `ci`, `docs`, `deps`.
  Example: `feat(core): add health system`.
- One task per branch. Parallel agents each use their own branch and git worktree
  (see `docs/agents/running-agents.md`).

## Forbidden actions

- Never weaken a guardrail to make a check pass. That means no:
  - `eslint-disable` without naming the rule and giving a `-- reason`,
  - `@ts-ignore` / `@ts-nocheck`, or `any`,
  - skipped (`.skip`, `.only`, `.todo`) or deleted tests, or weakened assertions,
  - lowered coverage thresholds.
- If a guardrail blocks a legitimate change, **stop and explain why**. A human decides whether
  to change it through an ADR in `docs/decisions/` (`/adr` skill drafts one).
- No new dependencies without explicit human approval. Never hand-edit `package-lock.json`.
- Stay in scope: change only what the task needs. No drive-by refactors, renames, or
  reformatting of untouched files.
- Never invent library APIs. Check the installed types in `node_modules` first.
- Never make product or game-design decisions. Every gameplay number traces to
  `docs/reference/` or `docs/requirements/`; if requirements are unclear, ask (or add an
  `INBOX.md` question for the product owner).
- Never add copyrighted assets (images, sounds, fonts) the team has no licence for.

## Architecture (planned; full version: `docs/architecture/`)

1. `packages/core` (`@eternalus/core`) is the simulation: pure TypeScript. No React, DOM, Canvas
   or Node APIs.
2. Dependencies point `client → core` only.
3. Import core only as `@eternalus/core`, never a deep path.
4. No import cycles.
5. `apps/client/src/ui/` imports only from `bridge/`, `ui/`, `styles/`. Never `game/` or core.
6. `game/views/` only reads snapshots (`import type` from core) and draws through `Renderer`.
7. Only `game/engine/render/Canvas2dRenderer.ts` touches the Canvas 2D context.
8. core never uses `Math.random`, `Date`, `performance.now`, `setTimeout` or `setInterval`.
   Use the seeded RNG and tick counts.
9. The simulation advances in fixed ticks (30/s). Input and bots produce `Command`s, applied
   on the next tick. Developer-menu actions are Commands too (replayable).
10. Game state is the single source of truth. React shows throttled snapshots via the store.
11. Tuning numbers, display names and world parameters (`numLanes`, towers per lane, …) live in
    `packages/core/src/content/` and `config/`, looked up by ID and injected; never in code.
12. Systems talk through typed `GameEvents`, never by calling each other. Variation by kind
    goes through strategies and registries, never `switch (kind)`.
13. Persisted data and assets go through one facade each: `PersistenceController` and
    `ResourceController` in `apps/client/src/data/`.
14. Entities: shallow inheritance (≤ 3 levels below `Entity`) for taxonomy, components for
    state, strategies for behaviour, systems for per-tick logic (ADR 0006).

TypeScript and ESLint catch parts of rules 1–3 and 8; everything else is checked in review.

## Where code goes

| Code                                       | Location                                        |
| ------------------------------------------ | ----------------------------------------------- |
| Game rules, entities, components, systems  | `packages/core/src/`                            |
| Tuning numbers, display names, definitions | `packages/core/src/content/`                    |
| World/match parameters (`numLanes`, caps)  | `packages/core/src/config/`                     |
| Map generation, world grid, flow fields    | `packages/core/src/map/`                        |
| Physics, collision                         | `packages/core/src/physics/`                    |
| Bots and controllers                       | `packages/core/src/ai/`                         |
| Runtime invariants, logger port            | `packages/core/src/diagnostics/`                |
| Loop, renderer, camera, devices, audio     | `apps/client/src/game/engine/`                  |
| Drawing game objects, minimap              | `apps/client/src/game/views/`                   |
| Keyboard/mouse/gamepad → InputAction       | `apps/client/src/game/input/`                   |
| Match composition root, session controller | `apps/client/src/game/`                         |
| Menus, HUD, reusable React pieces          | `apps/client/src/ui/{screens,hud,components}/`  |
| Game ↔ React events and store              | `apps/client/src/bridge/`                       |
| Persistence (IndexedDB) and asset loading  | `apps/client/src/data/{persistence,resources}/` |

If nothing fits, propose a location and ask. Do not invent new top-level folders. The full
decision table is in `docs/architecture/02-code-structure.md`.

## Coding standards (full version: `CONTRIBUTING.md`)

- TypeScript only: no `.js`/`.jsx`/`.mjs`/`.cjs` files (`npm run check:no-js`, run by the git
  hooks and CI). Only `eslint.config.js` and `scripts/**/*.mjs` tooling are allowlisted.
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
- Never use `console` in app code (lint fails); log through the `Logger` port.
- Keep files short (~300 lines) and functions small (~60 lines); split them when they grow.

## Testing

- Every behaviour change comes with tests. Every bug fix comes with a test that failed before it.
- Tests sit next to the file they test in `src/`, named `<name>.test.ts(x)`
  (e.g. `MovementSystem.ts` + `MovementSystem.test.ts`).
- Tests are deterministic: seed any randomness, and advance time only by stepping the
  simulation or a fake frame scheduler, never with real timers.
- Every test asserts something. Coverage thresholds only ever go up.
- Core behaviour also gets a determinism check (same seed + commands → same `StateHasher` hash);
  runtime invariants get a test that deliberately triggers them.

## Documentation

- Every doc under `docs/` has YAML frontmatter (`title`, `description`, `audience`, `status`,
  `owner`, `last-reviewed`, `tags`, optional `paths`, `related`); `npm run docs:check` enforces it.
- When behaviour, layout or workflow changes, update the governing doc and bump `last-reviewed`.
- Docs must outlive the code they describe (OG-12, ADR 0011): design docs state intent,
  invariants and extension points; they name where a value lives instead of copying it; interim
  state goes in one "Implementation status" note, never into the design text; historical records
  (accepted ADRs, dated changelogs, `PROGRESS.md` entries, dated reviews, prompts that have run)
  are never rewritten.

## Commands

`npm run check` (everything, same as CI) · `npm run check:quick` · `npm run check:no-js` ·
`npm run test` · `npm run lint` · `npm run typecheck` · `npm run knip` · `npm run docs:check` ·
`npm run docs:index` · `npm run format`. Full list: `README.md`.

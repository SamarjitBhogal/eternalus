# AGENTS.md: `@eternalus/core`

Package-specific rules. The root `AGENTS.md` still applies.

## Boundaries

- Pure, deterministic TypeScript. The tsconfig has no DOM or Node types on purpose: if you
  need `window`, `document`, `console`, `setTimeout` or a canvas, the code belongs in the client.
- Randomness comes only from a seeded RNG. Time is measured only in ticks (30 per second).
- The public API is `src/index.ts`. Export only what the client needs; keep systems internal.
  Adding an export is an API change: mention it in the PR.

## Folders

Core is **L2 Domain**, the innermost layer of the program (`docs/architecture/01-layered-oop-model.md`):
it imports nothing outside itself, and the client depends on it, never the reverse. Inside core,
modules form rings from the inside out: `utils/` and `teams/`, then `content/`, then `components/`,
then `entities/`, then `systems/`, `state/`, `commands/`, `ai/` and `Simulation.ts`. A module may
import its own ring and the rings inside it, never one further out; ESLint enforces this
(`eslint.config.js`, "Core module rings" in `docs/process/guardrails.md`). Folders not built yet
are created as code is added.

| Folder          | Holds                                                                                                   | May import                                    |
| --------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `content/`      | Data only: tuning numbers, display names, keyed by kebab-case IDs; `ContentCatalogue` and `validation/` | `content/`, `utils/`, `teams/` (types)        |
| `utils/`        | Generic helpers: vector math, `SeededRandom`, constants                                                 | `utils/` only                                 |
| `teams/`        | The `Team` / `PlayableTeam` types                                                                       | `teams/`, `utils/`                            |
| `components/`   | Data owned by entities (`Transform`, `Movement`)                                                        | `utils/`, `teams/`, `content/`                |
| `entities/`     | `Entity` root, families, concrete kinds, registry and factory                                           | `components/`, `content/`, `teams/`, `utils/` |
| `commands/`     | `Command` union and `applyCommand`                                                                      | `state/`, `entities/`, `utils/`               |
| `state/`        | `GameState`, `GameEvents`, `GameSnapshot`                                                               | lower layers                                  |
| `systems/`      | Per-tick logic implementing `System`. Never import another system.                                      | everything except `ai/`                       |
| `ai/`           | Bot controllers. They only return `Command`s.                                                           | `state/`, `commands/`, `utils/`               |
| `Simulation.ts` | Composes everything; the only thing the client drives                                                   | everything                                    |

ESLint enforces the rules for `utils/`, `teams/`, `content/`, `components/` and `entities/`; the rest
are checked in review.

## Adding code

- New system: create `src/systems/<Name>System.ts` and its test, then register it in the
  simulation's list of systems (list order is execution order).
- New component: create `src/components/<Name>.ts` and its test.
- Each class gets its own file, with types and constants in `<ClassName>.types.ts` /
  `<ClassName>.constants.ts` (see `CONTRIBUTING.md` §3.1).
- New tuning value: add it to a file in `content/` with a `// TUNE:` comment if provisional.
- Inheritance: at most 3 levels below `Entity`. Prefer adding a component.

## Tests

- Each test sits next to its source file: `src/systems/MovementSystem.ts` +
  `src/systems/MovementSystem.test.ts`. Test files are excluded from the published types.
- `src/index.test.ts` checks exactly which runtime values the public API exports.
- `src/entities/playerScenarios.test.ts` plays player stories through the real entity layer.
- Coverage thresholds (80% lines/branches/functions/statements) live in `vitest.config.ts` and
  only go up.

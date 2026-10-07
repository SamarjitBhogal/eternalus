# AGENTS.md: `@eternalus/core`

Package-specific rules. The root `AGENTS.md` still applies.

## Boundaries

- Pure, deterministic TypeScript. The tsconfig has no DOM or Node types on purpose: if you
  need `window`, `document`, `console`, `setTimeout` or a canvas, the code belongs in the client.
- Randomness comes only from a seeded RNG. Time is measured only in ticks (30 per second).
- The public API is `src/index.ts`. Export only what the client needs; keep systems internal.
  Adding an export is an API change: mention it in the PR.

## Folders

**Today** core contains `components/`, `content/maps/`, `entities/`, `map/`, `teams/` and `utils/`
(the first entities and the generated map, Sprint 1). The other folders below are the **planned**
layout; create them as code is added.

| Folder          | Holds                                                               | May import                                |
| --------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| `content/`      | Data only: tuning numbers, display names, keyed by kebab-case IDs   | `content/`, `utils/` and `teams/` (types) |
| `teams/`        | `PlayableTeam` and `Team`, shared by every layer                    | nothing                                   |
| `map/`          | `MapGenerator`, `MapBuilder`, `WorldMap`, lane and symmetry helpers | `content/`, `teams/`, `utils/`            |
| `utils/`        | Generic helpers: vector math, `SeededRandom`, constants             | `utils/` only                             |
| `components/`   | Data owned by entities (`Transform`, `Movement`)                    | `utils/`, `content/`, `teams/` (types)    |
| `entities/`     | `Entity` root class and factories                                   | `components/`, `content/`, ...            |
| `commands/`     | `Command` union and `applyCommand`                                  | `state/`, `entities/`, `utils/`           |
| `state/`        | `GameState`, `GameEvents`, `GameSnapshot`                           | lower layers                              |
| `systems/`      | Per-tick logic implementing `System`. Never import another system.  | everything except `ai/`                   |
| `ai/`           | Bot controllers. They only return `Command`s.                       | `state/`, `commands/`, `utils/`           |
| `Simulation.ts` | Composes everything; the only thing the client drives               | everything                                |

These import rules are checked in review.

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
- `src/index.test.ts` pins the public API surface (the runtime exports of `src/index.ts`);
  update it in the same change whenever an export is added or removed.
- Coverage thresholds (80% lines/branches/functions/statements) live in `vitest.config.ts` and
  only go up.

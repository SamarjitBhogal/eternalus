---
name: new-system
description: Add a per-tick System (or a Component/Strategy it needs) to packages/core with deterministic tests and the SystemPipeline registration. Use when asked to implement game logic that runs every tick.
---

# New system

Systems own per-tick logic; entities own data. Follow `docs/architecture/03-game-model.md`
(commands, events, determinism), `02-code-structure.md` (folders) and the "add a system" recipe
in `17-extension-recipes.md`.

## Procedure

1. Name it `<Name>System` and put it in `packages/core/src/systems/<Name>System.ts` (only the
   class; companion `.types.ts` / `.constants.ts` if needed). Implement the `System` interface
   (`update(state: GameState, tick: number): void`).
2. Inputs and outputs: read `GameState`, read content by ID, emit typed `GameEvents`. Never call
   another system, never import a sibling `*System`, never read `Date`/`performance`/timers, and
   never use `Math.random` (use the state's `SeededRandom` stream).
3. Register it in `SystemPipeline` at the right position (order is execution order; the
   canonical order is in `docs/architecture/03-game-model.md`). One line.
4. If the system needs new data on entities, add a `Component` in
   `packages/core/src/components/<Name>.ts` with encapsulated state and small invariants, and a
   test. If behaviour varies by entity kind, add a `Strategy` interface + implementations and
   select them from the content definition; no `switch` on kind inside the system.
5. Tests (`<Name>System.test.ts`): build a minimal `GameState` with a fixed seed, step the
   system N ticks, assert state and emitted events. Add a determinism test (same seed + commands
   twice -> equal `StateHasher` hash). If the system can violate an invariant, add or extend an
   `Invariant` in `packages/core/src/diagnostics/` with a test that triggers it.
6. Append a `docs/plan/PROGRESS.md` entry; tick the sprint checkbox in the phase doc if the task
   is listed there.
7. Run `npm run check` and report verbatim. Do not commit unless asked.

## Done when

- Registered in one place; no sibling-system imports; deterministic tests pass; coverage did not
  drop; `npm run check` passes.

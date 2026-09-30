---
name: new-content
description: Add or tune content and configuration data (definitions by kebab-case ID, GameConfig values such as numLanes or spawn cadence, balance knobs) without touching behaviour code. Use when asked to change numbers, names, or add a data-only variant.
---

# New content / config change

Tuning numbers, display names and world parameters are data. Behaviour code looks them up by
ID. Follow `docs/architecture/03-game-model.md` (GameConfig) and `04-entity-architecture.md`
(Type Object definitions). The litmus test: changing `numLanes`, `spawnTowersPerLane` or
`buffTowersPerLane` regenerates the map and minimap with no code change.

## Procedure

1. Find the owning definition: `packages/core/src/content/<area>/<kebab-id>.ts` for game data,
   `packages/core/src/config/` for world/match parameters. If the value is in code, that is a
   bug: move it to content and reference it by ID (report it in the PR).
2. IDs are kebab-case and are **never renamed** once used (save files and replays reference
   them). Display names may change freely.
3. Keep definitions immutable (`as const satisfies ...`); every provisional number carries
   `// TUNE:` with the source (game doc section or `docs/reference/suggestions/balancing.md`).
4. Validate: definitions are checked by `validateContent()`/`validateGameConfig()` tests; add a
   case if you add a new field. Cross-references (an ability referencing a status effect) must
   resolve.
5. Tests: the content test suite (`content/**/*.test.ts`) must still pass; for config changes,
   run the map-generation tests with the new values.
6. Update `docs/reference/game-design/*` if the design number changed and note the change in
   `docs/plan/PROGRESS.md`.
7. Run `npm run check`; report verbatim. No commits unless asked.

## Done when

- No behaviour code changed (or the moved magic number is explained); IDs unchanged; content
  tests pass; `npm run check` passes.

---
name: new-ability
description: Add or change an ability, ultimate, status effect, weapon or artifact as content plus (optionally) one AbilityEffect strategy, with scenario tests. Use when asked to add abilities, weapons, gadgets, buffs or debuffs.
---

# New ability / weapon / status effect

Abilities are data composed from `AbilityEffect` strategies. Follow
`docs/architecture/05-abilities-weapons-and-loadouts.md` and the recipes in
`17-extension-recipes.md`. Restrictions are predicates in data, never `if (class === ...)` in code.

## Procedure

1. Read the design source: `docs/reference/game-design/06-abilities-and-progression.md` or
   `07-weapons-and-artifacts.md`, and check the MVP status in
   `docs/requirements/06-mvp-requirements.md`. Ask before implementing anything tagged
   post-MVP or idea-pending.
2. Content: add `packages/core/src/content/abilities/<kebab-id>.ts` (or `weapons/`,
   `artifacts/`, `status-effects/`) with an immutable definition: display name, slot, cooldown
   ticks, aether cost, targeting, `effects[]`, `varieties[]`, `restrictions[]`. Every number is
   `// TUNE:` until balanced.
3. Effect: only if no existing `AbilityEffect` (damage, heal, buff, debuff, dash, knockback,
   zone, projectile, summon, reveal) fits, add
   `packages/core/src/abilities/effects/<Name>Effect.ts` implementing `AbilityEffect`, and one
   registration line in `AbilityRegistry`.
4. Restrictions: add an `AbilityRestriction` predicate only if a new kind of rule is needed
   ("only near a BuffTower", "not while carrying"); otherwise reuse and configure in content.
5. Tests: a scenario test that casts the ability in a minimal `GameState` and asserts the
   effects, cooldown and aether accounting over ticks; a determinism check; for weapons, an
   `AttackStrategy` test with the on-hit effects.
6. HUD: nothing to change - `AbilityBar` reads slots and `<KeyGlyph action="ability-n"/>`
   shows the current binding. If you think the HUD must change, stop and explain.
7. Append to `docs/plan/PROGRESS.md`; run `npm run check`; report verbatim. No commits unless
   asked.

## Done when

- The ability exists as content (+ at most one new effect class + one registry line); scenario
  tests pass; no magic numbers in code; `npm run check` passes.

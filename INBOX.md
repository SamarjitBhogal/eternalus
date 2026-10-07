# INBOX — product owner ⇄ agent queue

**Protocol.** Sam (product owner + lead architect) writes requests, feedback and decisions in
this file, then says **"file updated"** in chat. The agent reads this file and treats the open
items as its prompt, in order. An item may be removed **only** after the agent has implemented
it and confirmed it is done; it then moves to _Done_ with the date and the commit/PR. Items the
agent cannot finish stay open with a note. Every session starts by reading this file
(`scripts/hooks/session-start.mjs` reports the number of open items).

Format: one checkbox per item. Put decisions under "Decisions", tasks under "Requests",
review comments under "Feedback". Answered decisions are recorded in
`docs/reference/game-design/13-owner-decisions-log.md` and then moved to _Done_ here.

## Decisions needed from Sam

Three items from the 2026-10-03 batch asked for elaboration. Reply inline (`Decision: …`).

- [ ] **DEC-11 (was DISC-19 / DISC-39) — third ability and single ultimate per class.** The game
      doc names only **two** abilities per MVP class (Warrior: Veil, Blade Runner; Sentinel: Rip &
      Tear, Slam; Magus: Imbue, Shockwave) while the rule is "3 abilities + 1 ultimate". It also
      lists **two ultimates** for Magus (Death Ray, Nova) and Sentinel (Berserk, Meteor Fall) and
      one for Warrior (Fury). Needed before Phase 4 content is written.
      Options: (a) **Recommended** — third abilities from `suggestions/more-abilities.md`:
      Warrior **Hamstring**, Sentinel **Shield Wall**, Magus **Sanctuary**; MVP ultimates
      Death Ray (Magus), Berserk (Sentinel), Fury (Warrior); Nova / Meteor Fall / Eclipse become
      loadout-selectable alternative ultimates post-MVP. (b) Keep both ultimates per class as a
      loadout choice in the MVP (more content, more balancing). (c) Your own picks.
- [ ] **DEC-12 (was DISC-33) — corner-camp crystal timers.** "Crystals" are the unbreakable
      crystals inside the four **corner camps** (game doc, "Outer (Corner) Camps" and "Minion
      Buffs on Boss Spawn"): the crystal respawns the camp's mini-boss **300 s** after it dies,
      and once the central boss has spawned it also emits light/medium waves toward your lanes
      every **240 s**. Accept both timers as TUNE starting values? (Corner camps are first in the
      cut order, so this only matters if time allows.)
- [ ] **DEC-13 (was DISC-34) — match length.** Left blank in the last batch. Proposal:
      `plannedMatchSeconds: 1200` (quarter mark 300 s → mini-bosses; mid-game 600 s → gem
      summons the boss), no hard time limit, optional score cap at 2700 s. Accept or give numbers.

## Requests for the agent

- [ ] **Session A (from session B, 2026-10-06):** session B's `config/` and `utils/` have
      landed on `feat/sim-kernel`. (1) Keep `FeatureOwner` exported from
      `content/maps/maps.types.ts` (as a deprecated alias of `Team`): B's `state/` and `commands/`
      files and C's `components/TeamMembership.ts` import it from there, and A may not edit them.
      (2) The swap: `DEFAULT_MAP_CONFIG` → `createDefaultGameConfig().map`; `validateMapConfig` →
      `validateGameConfig` (same rules); `MapRandom` / `map/Rng.types.ts` → `utils/Rng.types.ts`
      and `SeededRandom` (`next()` is `nextFloat()`); `polarPoint` → `utils/deterministicMath.ts`;
      `DEFAULT_MAP_LAYOUT.navCellSize` → `config.map.navCellSize`; delete the local `MapConfig` in
      the same merge (both branches export `MapConfig` from `index.ts`). (3) The determinism lint
      (ADR 0012) lands with PR #13: `utils/geometry.ts` must call `utils/deterministicMath.ts`
      instead of `Math.cos`/`Math.sin` in the merge, or lint fails.
- [ ] **Session C (from session B, 2026-10-07; owner-approved, DEC-18):** the simulation kernel
      (PR #13) leaves these to session C. The B-owned lines named here are C's to change, an
      exception to the ownership table (`docs/agents/prompts/2026-10-03-ultracode-sessions.md`
      §2.6). Read 03 §12 and 15 §13 ("Implementation status")
      first. (1) `Simulation.ts`: pass `createDefaultEntityRegistry()` to its `EntityFactory`
      (marked `TODO`) so `dev-spawn` finds kinds. (2) `commands/defaultCommandHandlers.ts` and
      `commands/handlers/`: replace the `UnsupportedCommandHandler` lines for `move` and `stop`
      with real handlers when `MovementSystem` lands (recipe R16); the other unsupported commands
      wait for their systems. (3) `commands/handlers/DevSpawnHandler.ts` and
      `DevRemoveEntityHandler.ts`: hand spawns and removals to `SpawnSystem` / `DeathSystem`
      (marked `TODO`; 03 §4 makes `DeathSystem` the only `entity-removed` emitter).
      (4) `state/StateHasher.ts`: add every new component's simulation fields to `fieldsOf`
      (03 §9). (5) `entities/EntityFactory.ts`: take ids from `utils/IdGenerator` (03 §2).
      (6) With the `InvariantRunner`: add `GameState.recentCommands` (recorded by
      `Simulation.step()`), `LogRecord.context` in `diagnostics/Logger.types.ts`, and report
      violations with the `invariant-violated` `DiagnosticEvent` already declared (15 §4–§5).
      (7) `state/GameEvents.types.ts`: import `ShieldBar` from `components/Health.types.ts` once
      `Health` has shields.

## Feedback

- [ ] _(none yet)_

## Done

- 2026-10-07 — **Session B's simulation kernel items** signed off and done: the snapshot shape
  (DEC-15) and the `makeLogRecord` options object (DEC-16) folded into 03 §5 and 15 §4; the
  determinism lint (DEC-17, ADR 0012) added; the kernel's design differences (DEC-18) folded into
  02, 03, 15 and 17 R16, with "Implementation status" sections in 03 and 15; the replay fixture
  format written into 15 §7. Recorded in `docs/reference/game-design/13-owner-decisions-log.md`.
  Branch `feat/sim-kernel` (PR #13).
- 2026-10-03 — **DEC-01…DEC-10 and the discrepancy answers** recorded in
  `docs/reference/game-design/13-owner-decisions-log.md`; plan re-cut to four two-week sprints
  ending 2026-11-27 (`docs/plan/README.md` §0); ADR 0004/0006/0009 statuses updated; 32
  discrepancy rows marked decided; the owner's interface flow written up in
  `docs/reference/game-design/14-interface-and-screen-flow.md`; `SessionPhase` extended with
  `character-select` / `pre-launch` / `match-loading` in `docs/architecture/13-game-interface.md`;
  Assault → **Warrior** adopted (class `Warrior`, content id `warrior`); new ideas (Tower
  Guardians, weapon upgrades, level visuals, team skins) logged with MVP status. Branch
  `docs/inbox-decisions-2026-10-03`.
- 2026-09-30 — Phase 0 documentation + harness written on `docs/phase-0-foundation`
  (merged as PR #3; see `docs/changelog/2026-09-30-phase-0-foundation.md`).

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
- [ ] **Session B (2026-10-06) — two better-than-design items in the simulation kernel.**
      Signed off before the PR opens: the design docs (03 §5, 15 §4) are updated in that PR, with
      Sam's OK for the doc edit; declined: session B reworks the code. (1) **Snapshot entity
      shape:** `EntitySnapshot` groups its fields as `transform` (`x`, `y`, `radius`), `health`
      (`current`, `max`) and `team`, each `null` when
      the entity lacks that component, instead of architecture 03 §5's flat `x`, `y`, `radius`,
      `health`, `maxHealth`, `team`; an entity is never given made-up values. Session H codes
      against it. **Recommended:** adopt. (2) **`makeLogRecord`** takes its optional `attributes`,
      `tick` and `eventName` as one options object instead of 15 §4's positional arguments (four
      parameters at most, CONTRIBUTING §4). **Recommended:** adopt. Branch `feat/sim-kernel`.

## Requests for the agent

- [ ] **Session A (from session B, 2026-10-06):** session B's `config/` and `utils/` have
      landed on `feat/sim-kernel`. (1) Keep `FeatureOwner` exported from
      `content/maps/maps.types.ts` (as a deprecated alias of `Team`): B's `state/` and `commands/`
      files and C's `components/TeamMembership.ts` import it from there, and A may not edit them.
      (2) The swap: `DEFAULT_MAP_CONFIG` → `createDefaultGameConfig().map`; `validateMapConfig` →
      `validateGameConfig` (same rules); `MapRandom` / `map/Rng.types.ts` → `utils/Rng.types.ts`
      and `SeededRandom` (`next()` is `nextFloat()`); `polarPoint` → `utils/deterministicMath.ts`;
      `DEFAULT_MAP_LAYOUT.navCellSize` → `config.map.navCellSize`; delete the local `MapConfig` in
      the same merge (both branches export `MapConfig` from `index.ts`).
- [ ] **Sam (from session B, 2026-10-06):** the sprint 1.1 determinism lint (02 §11:
      `no-restricted-properties` for `Math.sin/cos/atan2/exp/pow` in core with an override for
      `utils/deterministicMath.ts`) is not added: `eslint.config.js` is outside B's files and A's
      `utils/geometry.ts` still calls `Math.cos`/`Math.sin` until its swap. Add it after A's
      merge (it tightens a guardrail).
- [ ] **Docs owner (from session B, 2026-10-06):** fold the simulation-kernel deltas listed in
      `docs/changelog/pr-feat-sim-kernel.md` ("Differences from the design") into 02 §2/§9,
      03 §2–§9 and 15 §4/§7, as design text once the decisions above are signed off and as an
      "Implementation status" note for the interim ones; document the replay fixture format in
      15 §7 (closes the sprint 1.1 replay checkbox).

## Feedback

- [ ] _(none yet)_

## Done

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

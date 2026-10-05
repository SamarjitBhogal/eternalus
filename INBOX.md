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

- [ ] **DEC-14 — map generator differs from architecture 06 (feat/map-generator).** Sign off
      or reject each (details: `docs/reviews/2026-10-05-map-code-audit.md` §4 and §6,
      architecture 06 §10). An independent review judged (a), (c) and (d) **better than the
      written design** and (b) **acceptable** (what prompt A asked for):
      (a) **camps split unevenly** when `campsPerSide` does not divide by `numLanes - 1`
      (leftovers to the middle corridors) instead of rejecting the config, so the default 6 camps
      survive `numLanes: 5`; (b) **presets give a lane profile and a symmetric rift width
      profile** in fractions of the world, not per-lane traced paths, so `map-1` works for any
      odd lane count and scales with the world (tested 1600×900 to 3200×1800, 1600×1800 and
      2400×900; layout lengths are absolute, so very small worlds such as 800×450 are rejected);
      (c) **gates are centred on each lane exit** (exits spread evenly over a 140° arc, as
      arch 06 §3 says) with walls filling the rest, so gate count always equals lane count. The
      written fixed-segment ring only manages that if `segments` and its rotation are retuned for
      each lane count (with 8 segments, 7 evenly spread exits must share segments). A minimum gate
      opening rejects configs whose turrets would seal a gate (today `numLanes` ≤ 7);
      (d) lanes are traced for Light only and mirrored, and `WorldMap` counts overlapping
      footprint stamps. Recommendation: accept all four and fold them into arch 06.
- [ ] **DEC-15 — camp weights by depth (DISC-42) in practice.** The default map yields 4 light +
      2 heavy camps per side and no medium ones; with one camp per corridor (`numLanes` ≥ 7) every
      camp is heavy. Proposal: keep depth-based weights but define the classes by position in the
      corridor (nearest-lane camps light, middle medium, deepest heavy), or give the count per
      class in content. Pick one. Note: "depth" is the distance to the nearest lane over half the
      corridor's height, so in tall worlds with steep lanes every camp reads as light.
- [ ] **DEC-16 — tooling: lint ignores agent worktrees.** ESLint's flat config does not read
      `.gitignore`, so linting from the main checkout also lints every `.worktrees/*` checkout and
      one unfinished worktree blocks every push from the main checkout. Proposal: add
      `.worktrees/` and `.claude/worktrees/` to `globalIgnores` in `eslint.config.js` (each
      worktree is still linted by its own hooks and CI).

## Requests for the agent

- [ ] **Session B (from session A, 2026-10-05):** (1) add `utils/deterministicMath.ts`
      (architecture 01 rule 8); the map code keeps its only `Math.cos`/`Math.sin` in
      `utils/geometry.ts` `polarPoint` until then. (2) `GameConfig.map` must keep the field names
      of the local `MapConfig` in `packages/core/src/map/MapGenerator.types.ts`; session A will
      then delete the local type (both are exported as `MapConfig`, so the swap must happen in one
      change). (3) The map's nav cell size is content (`DEFAULT_MAP_LAYOUT.navCellSize`) until it
      has a `GameConfig` home.

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

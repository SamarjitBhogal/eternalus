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

Each item below lists only what your 2026-10-09 answer left open, with your answer kept under it.
Reply inline (`Decision: …`).

- [ ] **DEC-42 — still open after your answer** (recorded as DEC-42 in
      `docs/reference/game-design/13-owner-decisions-log.md`, 2026-10-16; questions from PR
      #35). (1) Can a stunned unit still act while its aim wobbles, or does stun keep "cannot
      move, attack, cast or interact"? (2) Do the per-source stuns in `balancing.md` (0.5–1 s)
      stand, with 2 s only the default? (3) How large is the wobble ("slightly")? (4) Does
      blind's white vignette replace more-abilities §7's −70% vision radius, or come on top of
      it, and does its 2–3 s fade start when blind lands or when it ends?
  - Your answer (chat, 2026-10-16): "2 seconds. blind makes aim slightly wobbly (like stun), but
    also causes the screen to have a heavy white vignette that dissipates over 2-3 seconds. yes,
    aimed projectiles miss too"; picks: "Stun default", "Wobble causes misses", "Yes, stun
    wobbles too".
- [ ] **DEC-36 / DEC-37 — accept ADR 0016 and answer the plan §9 questions.** The course
      instructor's two new requirements, Duel multiplayer (DEC-36) and a server for hundreds or
      thousands of concurrent players (DEC-37), are planned now; must be implemented by the end of
      Sprint 3 (2026-11-13). The proposed design is
      `docs/decisions/0016-multiplayer-server-authoritative-duel.md` (draft): accept, change or
      reject it. The consolidated questions about the Duel mode and the server are in
      `docs/plan/multiplayer-and-scalability-plan.md` §9; answer them there or inline here.
- [ ] **DEC-11 — still open after your answer** (the approvals are recorded as DEC-11 in
      `docs/reference/game-design/13-owner-decisions-log.md`, 2026-10-10; your chat clarifications
      of 2026-10-10 answered the former (1) and (2), see Done). (3) Your Roar row says Legends only
      get the slow — does that hold in Duels too, and what does `feared` do to bots? Does
      `control-immune` cover fear? The same row cites `mechanics-ideas.md` for "Fear is bot-only in
      the MVP", but that file has no such text: what is the source? (4) Costs, cooldowns and
      magnitudes for the newly approved abilities, or may agents put `TUNE` placeholders in
      content?
  -     Hamstring ability approved for Warrior class. Fan of Sorrows also approved. Eclipse alternate ultimate approved for MVP
    - Shield wall, Sunder, and Colossus Roar approved for Sentinel class. Avalanche approved as alternate ultimate for MVP
    - Sanctuary and Aether Lance approved for Magus class (Enemy Sentinel's Sunder should shatter Sanctuary). Last Rites alternate ultimate approved for MVP.
- [ ] **DEC-11 — architecture approvals (impact review AB-3…AB-5).** The approved abilities need
      edits to architecture 05 that wait for your approval: §8, add `feared` (Colossus Roar) and
      `insanity` (DEC-12) to the status ids; §17, move `summon` (Shield Wall) from MVP-if-time to
      MVP and `reveal` (Aether Lance) from post-MVP to MVP, add the continuous `dash` that
      Avalanche needs, make combos MVP for "Sunder shatters Sanctuary", and list the class pools in
      its kit row (it still says "third abilities and ultimate picks: INBOX"). Approve, or say
      which to change; 05 stays as it is until then.
- [ ] **DEC-12 — volatile crystals, still open after your answer** (the timers and the volatile
      rule are recorded as DEC-12, 2026-10-10). (1) Does "once the centre boss spawns" mean the
      moment the boss is summoned or the mid-game mark? If the GreaterBoss (MVP-if-time) is cut,
      do the crystals ever turn volatile? (2) What does `insanity` do? Its name is yours, and its
      description and a placeholder icon may be added now, as you said. (3) The shockwave's radius
      and damage and the debuff's duration (or `TUNE` placeholders); does the shockwave hit every
      team; does a destroyed camp stay gone for the rest of the match? (4) How much health does a
      volatile crystal have, and who can break it (either team? damage only?) (Corner camps are
      first in the cut order, so this only matters if time allows.)
  -     Approved with this caveat: Onc the centre boss spawns, the outer camp's crystals become "volatile" and are now breakable but when they die, they release a shockwave destroying the camp and dealing massive AOE damage and temporary insanity debuff (TBD on what it does but the effect description/icon can be added with no actual effects applied)
- [ ] **DEC-13 — score cap, still open after your answer** (30-minute planned match recorded as
      DEC-13, 2026-10-10; the quarter mark and mid-game scale with it). Your "Accept after
      scaling" scales the proposal's optional score cap too: 2700 s for a 1200 s match becomes
      **4050 s** for 30 minutes (2.25 × the planned match). Confirm 4050 s, or give another value.
      The balance anchors tied to the old length (boss levels at the two marks, the match-length
      metrics in `balancing.md`, the soak length) also need your numbers.
  -     Accept after scaling to planned match time = 30 mins
- [ ] **Aether (MP) pool sizes per class.** The game doc gives no aether numbers. Branch
      `feat/legend-aether` adds the `Aether` component (MP) to every Legend, with `baseAether` taken
      from `suggestions/balancing.md` (level 1: Warrior 100, Sentinel 80, Magus 140; +10 per level,
      `TUNE`). Confirm the pool sizes or give your own. (Regen rate is a Phase 4 concern, not set
      yet.) The same branch adds Legend progression with balancing.md's other `Recommendation:`
      values, also for you to confirm: level cap 10, `xpToNext = 100 + 50·(L−1)`, +8% base health
      and +10 aether per level, Legend kill 150 + 25 × victim level, minion kill 20 / 45 / 120.
  - Update after your PR #31 review (O1–O8): cap 50 (O6). **Income estimate to check:**
    balancing.md says its XP sources take an active Legend to 2,700 XP in 18–22 minutes, about
    135 XP/min (minions about 110 XP/min, the rest kills and objectives). Keeping that income and
    balancing.md's curve shape (growth = half the first step), the cap-50 curve is
    `xpToNext(L) = 4 + 2·(L − 1)`, 2,548 XP to level 50, reached around minute 19. Kills are
    re-priced on the same scale: a Legend kill is 150 + 5 × victim level (a level-L victim is worth
    what a level-L/5 one was on the cap-10 curve; 400 XP at level 50). Mob XP is each mob's
    `xpValue` (light minion 20, training dummy 0, O8). If your income figure differs, the curve
    scales linearly: say the XP/min and I resize it. Still yours to sign off: `level-matches-xp`
    runs every tick, not heavy (05 §16), because rules 2–4 read this tick's `xp-gained` events.
    Also on the cap-10 scale: balancing.md's bosses' "expected Legend level" (4 and 7) need
    rescaling to cap 50 (×5 would give 20 and 35); say if you want that.

- [ ] **DEC-15 — camp placement, still open after your answer** (the rule is recorded as DEC-15,
      2026-10-10). (1) Does the random, parity-checked placement also apply to the corner camps?
      (2) Is parity per side only, or also per corridor? Only counts are matched, so one side's
      camps may sit nearer its lanes or Stronghold than the other's: acceptable? (3) The rule
      exempts camps from ADR 0009's mirror invariant, so it needs your sign-off on the amending
      ADR 0017 (next item) before the generator changes. (4) From ADR 0017: which classes does a
      corridor get when it holds other than three camps?
  -     Accepted " keep depth-based weights but define the classes by position in the corridor" where the vertical line down the centre of the map defines the division. RNG determines the location of the camps on each side so both sides are different, but they must equate in terms of overall difficulty (1 light on left means 1 light on right; not necessarily in mirrored locations but the same amount of weighted camps on left team and right team's sides)
- [ ] **DEC-15 — accept ADR 0017.** `docs/decisions/0017-balanced-asymmetric-camp-placement.md`
      (draft) amends ADR 0009 for forest camps only: the seeded RNG places them per side with
      equal counts per weight class, and everything else stays mirrored. Accept, change or reject
      it; the generator does not change until you accept it. Its open questions are DEC-15 (1),
      (2) and (4) above.
- [ ] **Session D (DEC-34) — the text of the delegated edits.** You delegated both items to the
      cleaner long-term design (recorded as DEC-34). The impact review proposes the text in
      `docs/reviews/2026-10-10-new-requirements-impact.md` §5.4: SD-1, option (a), no
      `useAppDispatch` and the UI emits intents (edits architecture 13 §5 and
      `apps/client/AGENTS.md`); SD-2, the 13 §2 `character-select` row records the class choice and
      starts the countdown while `menu` keeps building `MatchSetup`. Approve that text, or confirm
      that agents may apply it as delegated.
  -     Accept recommended option if it is cleaner long-term. For D, set to whichever is cleaner in the long-term.
- [ ] **Minion system (PR #33 review) — two decisions still open.** (1) **The worst lane
      (MS-9):** doc 18 §3.3 now scores your game doc's terms (structure damage not dealt,
      structures lost, pushed back), as one `LaneAssessment` shared by the heavy horde and the
      corner-camp reward wave, with a worked example. Sign off the terms, the weights and the tie-break (ties go to
      the middle lane, so the first heavy horde goes down it), or name others. (2) **Horde size and cadence (your M7):** size from (a) `hordeSizes` in config only,
      (b) each spawner's wave table only, or (c) a horde definition in content; cadence per
      spawner or one interval for all. Until you answer, M1 reads `hordeSizes` and the spawner
      cadences (plan §3 stand-in). Details: doc 18 §10.
- [ ] **Minion M1 (`feat/minion-m1-marching`) — one question, one better-than-design item.**
      (1) **First heavy horde:** DISC-10 says "every 180 s". Should the first one leave when the
      countdown ends, like the towers' waves (60 s, the current `Recommendation:`), or 180 s
      after it (240 s)? (2) **Better than the design (needs your sign-off):** doc 18 §3.2 and §4
      say each mob carries a `hordeId` back-pointer. The code keeps membership only in
      `state.hordes` (`hordeOf(id)`), which refuses double membership, so the two cannot drift
      apart. If you agree, doc 18 §3.2, §4 and 15's `HordeMembershipConsistentInvariant` change
      to the store lookup.
- [ ] **Minion M2a — controller memory (architecture 11 §2).** Controllers are stateless and
      "never mutate state", yet a brain's `memory` and `rngState` change with each decision
      (`MinionController`'s FSM state and timers, M2b). Should `decide` return
      `{ commands, memory, rngState }` for `AiSystem` to write back (`Recommendation:`, keeps
      controllers pure), or may a controller write its own brain?
  - Decision (SamarjitBhogal, chat, 2026-10-25): `decide` returns
    `{ commands, memory, rngState }` and `AiSystem` writes the brain back. Built in M2b
    (`feat/minion-m2b-minion-controller`); doc 11 §2 updated. Awaits the decisions log.
- [ ] **Minion M5a — strength by distance (DISC-24).** `balancing.md` proposes
      `m(t) = clamp(1 + 0.5 · (1 − 2t), 0.75, 1.5)`, which makes minions past mid-lane weaker
      than base. DISC-24 calls the curve "an addition on top of base stats", so M5a floors it
      at 1.0 (never weaker than base). (1) Is the floor right, or should 0.75 stand? (2) DISC-24:
      when a lane tower falls, "the base-stat distance extends further toward the enemy". By
      how much per tower (a fraction of the lane, a fixed distance, or up to the fallen tower)?
- [ ] **Minion M2b — sign-offs and numbers (PR for `feat/minion-m2b-minion-controller`).**
      Better than the design, for sign-off: (1) `PathingSystem` reads the attack target and hands
      the strategy a target and an arrival radius, so `LaneFollowMovementStrategy` never reads
      components (18 §5.2 says the strategy reads `Combat.targetId`); if accepted, 18 §5.2 and
      §7's guard strategy note change. (2) The formation slot function lives in
      `state/formationSlot.ts`, the one folder both `systems/` and `ai/` may import. (3)
      Controllers get their content (aggro rules, formations, kind classes) through their
      constructor from `Simulation`, not through `GameState` (11 §1). Numbers to confirm: the
      aggro radii scale League/Dota's 500 / 700 units by minion speed (5.4 m and 7.5 m), and
      `reformDistance` is 2 m with no reference. Design note: 18 §6.1 ends every chase after
      the aggro duration (69 ticks) followed by a 90-tick cooldown, minion against minion too,
      which may give a fight, walk back, fight again rhythm; Dota applies it to hero aggro only.
- [ ] **PROTO-01 — still open after your answer** (deletion recorded as DEC-35, 2026-10-10,
      amending DEC-33). (1) Is the escort deleted before real hordes exist (no minions on the map
      for a while) or together with them (Phase 2.7 `SpawnSystem` plus Phase 3.1 hordes)? Which
      sprint is "this sprint": S1, which ends 2026-10-16, or S2? (2) Your bot-AI system: may its
      file live under `systems/`, or must it stay in `ai/`? (Today it is in `ai/`, because core
      `AGENTS.md` forbids `systems/` importing `ai/`, which 02 §2 allows; audit A23-18.) (3) Add
      the `PROTOTYPE(<id>) TEMPORARY` marker convention to `AGENTS.md` so every future prototype
      uses it (audit A23-17)? **Finding the code:** every prototype piece carries `PROTOTYPE(PROTO-01) TEMPORARY` and
      what replaces it; `git grep -n 'PROTOTYPE(PROTO-01)'` lists them. Agents: do not build on or
      extend marked code. The two departures you were asked to confirm, speed 5.4 m/s and mass
      0.5, were answered by DEC-33 (demo-only; on `chore/sprint-1-audit`). **Agent note
      (2026-10-17):** (1) is answered by your reply below and DEC-35: the escort goes together
      with the real hordes, in minion plan phase M1, whose done-when is "no `PROTOTYPE(PROTO-01)`
      marker remains in code". (2) and (3) are still open; (2) decides doc 18 §2's folder list.
  -     Escorts to be deleted this sprint in favour of real hoards. The ai system mentioned here is unrelated to CLAUDE.md and AGENTS.md, but is instead meant as a stand-in for the Bot AI that will power the actions of the bots, neutral camps, bosses, and mobs

- [ ] **Combat — friendly fire (PR #34, `feat/combat-damage-pipeline`).** No reference doc says
      whether allies can hurt each other. The combat pipeline ships `FriendlyFireStep` as the
      default: no damage between entities on the same team (Legends never hurt allies; neutral
      bosses and camps never hurt each other); environment damage and teamless targets (trees)
      always pass. Confirm, or say which hits should go through. Removing it is one line in
      `combat/defaultDamageSteps.ts`.
- [ ] **Combat — better than the design, for sign-off (PR #34).** (1) 05 §9's fixed named
      stages are a list of `DamageStep`s whose order is `combat/defaultDamageSteps.ts`, so a new
      rule is one class and one line; (2) `defaultStrategyRegistry.ts` is a typed record per
      behaviour instead of `registry.register()`, so a missing strategy does not compile;
      (3) `DamagePipeline.apply` takes `GameState`, not `SystemContext`, so handlers and listeners
      can call it. 02, 04, 05 and 17 already describe the built version; approve or say what to
      change.
- [ ] **Combat — `no-death-without-killer` checks a different hole than 15 §3 (PR #34).** The
      15 §3 row checks that every `entity-died` carries a resolvable `DamageSource` (the type
      already forces one). The built invariant checks that every `died` removal had an
      `entity-died` with its killer this tick, which catches `Health` written around the damage
      pipeline (the requirements' "dies without another entity or a defensive tower killing it").
      Proposal: the 15 §3 row covers both, (a) now and (b) "the attacker resolves in the store"
      with abilities. Approve, or say what to change.
- [ ] **Status effects — numbers and rules to confirm (SCRUM-228, PR #35).** Modifiers now
      multiply (`op: 'mul'`, 05 §8), per your review. (1) If you want additive stacking
      instead, say so: it is one line in `StatusEffects.recompute`. (2) `stun` defaults to 1 s
      (more-abilities §7 says 0.5–1 s per source); each ability will pass its own once abilities
      land. (3) Blind spends a basic attack as a miss (`attack-missed`); ability damage still
      lands. (4) Better than the design, for sign-off: the component caches its multiplier
      table when its list changes (05 §8 recomputes per tick), and `StatusEffectApplier` is the
      one way in (05 §3 has effects call `StatusEffects.apply`; 03 names `StatusEffectSystem` as
      the `status-applied` emitter). (5) Not built yet: `polarity`, `controlClass` /
      `control-immune` (stun-lock risk once a producer reapplies stun), `onExpire` (crushed →
      slowed), bleed ignoring shields, concussion's aether cost, blind's vision cut, a max-health
      stat for the FR-029 aura. Confirm or correct.
  - Decision: DEC-40 to DEC-42 (`docs/reference/game-design/13-owner-decisions-log.md`,
    2026-10-16, PR #36). DEC-42's open questions are their own item (PR #36).
- [ ] **MS-28 — plan every AI-driven enemy in the minion plan (changes DEC-47's split).**
      SamarjitBhogal asked (2026-10-25) for the minion plan to cover enemy bots of every
      entity type. Proposed in doc 18 MS-28 and `docs/plan/minion-system-plan.md` (phases M6
      to M8, coverage table §1.1): camps and checkpoint assist spawns (3.4), bosses (3.6),
      A\* for Legends (3.2), and the Rover and bot ability use (3.7) move to the minion plan's
      breakdown. Nothing is dropped and the work still ships in Phase 3's weeks. Sprints 3.5
      and 3.8 stay in the Phase 3 plan, and turrets stay with the `Turret` (sprint 2.3). (1)
      Sign off the move, or keep DEC-47's split. (2) Which team do checkpoint defenders fight
      for: the zone's owner, the team being captured against, or neutral? (3) Does their leash
      follow the capture zone (doc 18 §7.1)?

## Requests for the agent - THESE SESSIONS ARE NO LONGER AROUND; THESE DECISIONS MUST BE MADE BY UPCOMING SESSIONS

- [ ] **Session C → Sam (2026-10-08, `feat/player-input`):** the keyboard now produces an
      `InputIntent`, but core's `intent` command is still `UnsupportedCommandHandler`
      (`TODO(sholtzman)`), so `Match` turns the intent into `move`/`stop` itself (09 §11). Should I
      write `PlayerController` + the `intent` handler (11 §4.1) in core, or is it yours? Either is
      fine; until then WASD works through `move`/`stop`.
- [ ] **Session C → Sam (2026-10-08), better than the design? (optional, no pressure):** (a) the
      focus-loss release (`blur`/`visibilitychange`) lives in `useMatch` instead of `Match`
      (09 §2), so `Match` uses no browser API (09 §10); (b) devices are polled and mapped inside
      `DeviceIntentSource` behind `Match`'s `IntentSource` port instead of in `Match.tick()`
      (13 §6.2), so `Match` never knows which devices exist. Yes → I update 09 §2 and 13 §6.2;
      no → I move both into `Match`.

- [ ] **Session A (from session B, updated 2026-10-07):** PR #13 merged the phase branch with
      `feat/map-generator`: B's files and `components/TeamMembership.ts` now use `Team` from
      `teams/teams.types.ts`, `polarPoint` and the wall-ring test call
      `utils/deterministicMath.ts`, and `index.ts` exports only `config/`'s `MapConfig`. Left for
      session A, the stand-in swap: `DEFAULT_MAP_CONFIG` → `createDefaultGameConfig().map`;
      `validateMapConfig` → `validateGameConfig` (same rules plus `navCellSize`); `MapRandom` /
      `map/Rng.types.ts` → `SeededRandom` and `utils/Rng.types.ts` (`next()` is `nextFloat()`);
      `DEFAULT_MAP_LAYOUT.navCellSize` → `config.map.navCellSize`; then delete the local
      `MapConfig` in `map/MapGenerator.types.ts`.
- [ ] **Session C (from session B, 2026-10-07; owner-approved, DEC-20):** the simulation kernel
      (PR #13) leaves these to session C. The B-owned lines named here are C's to change, an
      exception to the ownership table (`docs/agents/prompts/2026-10-03-ultracode-sessions.md`
      §2.6). Read 03 §12 and 15 §13 ("Implementation status") first.
      (1) `Simulation.ts`: pass `createDefaultEntityRegistry()` to its `EntityFactory` (marked
      `TODO`) so `dev-spawn` finds kinds; make `systems/defaultSystemPipeline.ts` (02 §9) the
      default of its `systems` parameter; wire `DebugConfig` there too, and if that takes the
      constructor past four parameters switch to `SimulationOptions` (03 §6, CONTRIBUTING §4)
      and tell session H in this file.
      (2) `commands/defaultCommandHandlers.ts` and `commands/handlers/`: replace the
      `UnsupportedCommandHandler` lines for `move` and `stop` with real handlers when
      `MovementSystem` lands (recipe R16); the other unsupported commands wait for their systems.
      `commands/` may not import `components/` (02 §2): reach `Movement` through a `state/`
      helper, as `EntityStore.countOnTeam` reaches `TeamMembership`, or ask Sam here to widen
      `commands/`'s imports first.
      (3) `commands/handlers/DevRemoveEntityHandler.ts`: hand removal to your `DeathSystem` (marked
      `TODO`; 03 §4 makes it the only `entity-removed` emitter). `DevSpawnHandler` keeps spawning
      directly until `SpawnSystem` exists (a later phase).
      (4) `state/StateHasher.ts`: add every new component's simulation fields to `fieldsOf`
      (03 §9).
      (5) `entities/EntityFactory.ts`: take ids from `utils/IdGenerator` (03 §2).
      (6) With the `InvariantRunner`: add `GameState.recentCommands` (recorded by
      `Simulation.step()`), typed structurally like `GameEventMap`'s `command-rejected`
      (`{ tick: number; command: { readonly type: string } }`) because `state/` may not import
      `commands/` (03 §4); add `LogRecord.context` in `diagnostics/Logger.types.ts`; report
      violations with the `invariant-violated` `DiagnosticEvent` already declared (15 §4–§5).
      (7) `state/GameEvents.types.ts`: import `ShieldBar` from `components/Health.types.ts` once
      `Health` has shields.
      **Status (session C, 2026-10-07, branch `feat/entity-systems`):** (1), (2), (4), (5), (6)
      and (7) done. `Simulation` now takes `SimulationOptions` (`config`, `seed`, `logger`,
      `systems?`, `debug?`, `content?`) and builds `DefaultSystemPipeline` (movement, death,
      invariants) when `systems` is omitted; its factory uses `createDefaultEntityRegistry()` and
      `loadDefaultContent()` (PR #14, DEC-21/22). (2) steers through
      `EntityStore.steer`; new reject reasons `invalid-direction` and `not-movable`. (6) ships
      `no-removal-without-cause`, `health-within-bounds` and `finite-transforms` (the 15 §3 name
      for the prompt's NaN-transform check). **(3) is still open**: see the request below.
- [ ] **Session C → Sam (2026-10-07): deferring `dev-remove-entity` to `DeathSystem`.** Routing
      the removal through `DeathSystem` (a removal request in `state/`, drained by the system)
      changes when the entity leaves within the tick, so `wanderSeed7.replay.ts` checkpoints
      change. Options: (a) **Recommended** — do it and re-record the fixture in the same PR;
      (b) keep the handler's immediate removal (today; `DeathSystem` removes only the dead).
      Also a question: the invariants in `diagnostics/` read `components/` (`Health`,
      `Transform`, `Movement`), which 15 §3 needs but 02 §2 does not list. May `diagnostics/`
      import `components/`? If yes, I'll update 02 §2 and the core folder table together.
- [ ] **Session C → session H (2026-10-07): `Simulation` takes one options object.** Call
      `new Simulation({ config, seed, logger })` instead of passing four arguments; omit
      `systems` to get the default pipeline and pass `debug` for the invariant level (architecture
      03 §6, 15 §2). Branch `feat/entity-systems`.

- [ ] **Session C → Sam (2026-10-07, PR #17): 2 optional ideas, no pressure.** Yes, no or "not
      now" are all fine; a no means I switch back to the documented design. 1. **`DefaultSystemPipeline` and `DefaultInvariantRunner` are classes** instead of the
      `defaultSystemPipeline.ts` / `createDefaultInvariants()` functions in 02 §9 and 15 §2. 2. **`InvariantViolationError` carries the seed, and each `Violation` its severity**, so a
      test failure prints everything needed to reproduce it (15 §2).

- [ ] **Session C → Sam (2026-10-08, PR #14 review): proposed, design text unchanged until you
      answer.** Each one is how the code works today; say yes (I update the doc) or no (I change
      the code).
  - (1) `passiveOptions`: a class chooses between passives (Magus: Studious or Necromancy),
    while 04 §5 has a single `passiveId`.
  - (2) `obstacleType`: `ObstacleDefinition.kind` stays `'obstacle'` (the entity class) and
    tree/rock/bridge go to `obstacleType`. It fixes the conflict between 04 §1/§5 and 07 §9.
  - (3) `Collider` fields: 04 §3 → 10 §4's `isStatic`/`isEnabled`/`isUnbreakable`.
  - (4) Shield naming: 04 §3 → 07 §2's `shields`/`addShield`/`removeShield`.
  - (5) **Doc conflict:** 10 §4 puts collider shapes in `physics/`, but 02 §2 forbids
    `components/` → `physics/`. Meanwhile they stay in `components/Collider.types.ts`.
  - (6) `packages/core/AGENTS.md` folder table: `content/` is "Data only", but it now also has
    `ContentCatalogue`, the validator and `loadDefaultContent()`. Proposed wording: "Definitions
    keyed by kebab-case id, plus the catalogue, its rules and the loader".
  - (7) 03 §12 "Implementation status" is out of date, and PRs #14 and #17 leave it unchanged
    until you approve new text. Proposed replacement for its bullets:
    - `Simulation` takes `SimulationOptions` (`config`, `seed`, `logger`, `systems?`, `debug?`,
      `content?`); `content` is a `DefinitionSource`, `loadDefaultContent(config.tickRate)` by
      default. Its `EntityFactory` uses `createDefaultEntityRegistry()`; omitting `systems` gives
      `DefaultSystemPipeline` (movement, death, invariants). No `exportReplay()` or `dispose()`.
    - `move` and `stop` steer through `EntityStore.steer`; `attack-target`, `cast-ability`,
      `intent` and `dev-set-controller` stay `not-supported` until their systems exist.
    - `DeathSystem` removes only entities whose health reached 0 until `dev-remove-entity` is
      routed through it (open below) and `SpawnSystem` exists.
    - `Movement` works per tick: `advance()` accelerates along the heading with no `|dv|` clamp,
      and without a heading slows by `acceleration` per tick instead of friction (10 §2);
      impulses, friction and the clamp arrive with knockback (Phase 2).
    - `GameState` keeps `recentCommands` and the seed for diagnostic reports; no `world`,
      `teams` or `hordes` yet.
  - (8) The core lint (ADR 0013) comes back as its own PR with an ADR for your sign-off, encoding
    02 §2's per-folder import lists, not rings.
  - (9) 07 §13 still says shield bars stay in "source id order"; per your optional item they now
    keep tower creation order (DEC-20). Proposed: reword that note.
  - (10) 04 §13: `EntityFactory.create(kind, definitionId, placement)` stands in for 04 §6's
    `spawn` (it resolves the definition and checks its kind once; adding to the store stays with
    the caller until `SpawnSystem`). Proposed: add that as an implementation-status note.

- [ ] **Session H → Sam and session F (2026-10-07, PR #18): two notes, no pressure.** (1) The log
      sinks (`SinkLogger`, `ConsoleSink`, `RingBufferSink`) are new files in
      `apps/client/src/data/logging/`, where 15 §4 puts them; that folder is session F's, so F
      should know they exist. (2) `GameLoop`'s first frame only sets the time origin, so 08 §3's
      `runFrames(2, 16.7)` example gives 0 ticks, not 1 (recorded in 08 §11). OK to keep?

- [ ] **Session C/H → Sam (2026-10-09, PRs #18 and #19): proposed "Implementation status" notes
      for 08 (§11) and 09 (§11).** AGENTS.md asks for one, your #14 rule asks for approval first,
      so the docs stay unchanged until you say yes. Interim differences in #18:
  - `FrameScheduler`, `RafFrameScheduler`, `FakeFrameScheduler` and `GameLoop` live in
    `game/engine/loop/`; the `Clock` is session D's `SessionClock`. `useMatch` stamps log
    records with `performance.now()` until it is wired.
  - `Camera` keeps `lookAt`/`visibleArea` and adds `track`, `zoomTo` (clamped), `contains` and
    `worldToScreen`/`screenToWorld` with an explicit `Viewport`; `MinimapProjection` arrives
    with the minimap work (SCRUM-151), which also draws entity markers.
  - `ViewRegistry` resolves kind, then family, then `DefaultEntityView` and reports each
    unknown kind once (built by `views/defaultViewRegistry.ts`); `LegendView` is a placeholder.
  - `Match` takes the player's intent through an `IntentSource` port; no `MatchBridge`,
    `PerfMonitor` or `MatchScreen` yet. `GameCanvas` owns the `Match` through `useMatch`. The
    player's Legend spawns with `dev-spawn` until `SpawnSystem` exists.
  - The first frame after `start()` only sets the time origin (asked below).
  - `Match.destroy()` stops the loop and its subscription; `useMatch` destroys the injected
    renderer and camera. `EntityLayer` does not cull yet.
  - The log sinks live in `data/logging/` (15 §4); the overlay cannot read the ring buffer yet.
  - `Canvas2dRenderer` scales X and Y separately, so a window that is not 16:9 stretches the
    64 × 36 m view.

  In #19 (input), 08 §11 would add that `Match` implements input's `Projection` port
  (`screenToWorld` only) over the camera and takes the intent from `DeviceIntentSource`; and 09
  §11 would record:
  - `InputSnapshot` has `keys`, `keyLabels`, `mouseButtons` and `pointer`; `wheel` and
    `gamepads` come with what needs them. No `poll()` and no `FakeInputDevice` yet; the
    `describeInputDevice` contract suite runs for both devices.
  - `InputMapper` indexes chords by `chordKey` itself (no injected `BindingResolver`) and has no
    `clientActions` yet. `Projection` lives in `engine/input/` with only `screenToWorld`
    (02 §3 lets `game/input/` import `engine/input/` types only). `ActionState` carries the
    pointer so `toIntent` can project it.
  - `Match` turns the intent's `move` into `move`/`stop` and drops `aim` and `triggered` until
    core's `PlayerController` handles `intent` (11 §4.1).
  - `useMatch` releases the devices on `blur`/hidden `visibilitychange` and binds the `wasd`
    preset until settings supply saved bindings. A minimap click is also an `attack` press until
    the minimap consumes its clicks (SCRUM-151).

- [ ] **F → G (2026-10-06): mount the pause overlay.** `ui/screens/MatchScreen.tsx` renders
      `<PauseOverlay />` from `ui/hud/PauseOverlay.tsx` unconditionally; it renders nothing
      unless `session.overlay` is `'pause'` or `'settings'`.
- [ ] **F → session H / the `Match` owner (2026-10-09): settings in the match.** PR #19 merged
      before F, so F's merge took F's input layer (DEC-26) and adapted `DeviceIntentSource` to its
      snapshot (`mouseButtons` is a `Set` of `MouseEvent.button` numbers, no `keyLabels`). Left
      for `Match`/`useMatch`: start from the player's bindings instead of `PRESETS.wasd`, re-read
      them on each `settings` bus event (`mapper.setBindings(s.bindings)`), and toggle the pause
      overlay on a `pause-menu` press edge (`open-overlay` / `close-overlay`), so the pause key is
      the player's binding.

## Feedback

- [ ] Answered below questions, or called out in section header.
- NEW REQUIREMENTS:
  - By the end of Sprint 3, two new items must be implemented, and therefore we must plan for them:
    - 1. Multiplayer support
      - We must be able to have at least 1 player playing against another.
      - We have decided the best way to have this work is to do a second game mode called "Duel"
      - Duel has matchmaking, looking for any other player currently waiting in a Duel queue
      - Duel spawns both players inside the Cathedral where the doors are closed and the surrounding world is deactivated to no longer spawn units or carry structures (environmental buildings, trees, etc., unaffected)
      - The players compete in a 1v1, first-to-10-kills match with a match-point system
      - After each kill, like in a standard fighting game, the players reset. any damage done to the map during this battle remains in place; only the players reset.
      - Ultimate abilities have continuous cooldown, while other abilities do not
        - Meaning: Your cooldown for an ultimate persists through life and death, where your other abilities have standard cooldown and reset to fully cooled down upon death
      - We would like to set up a simple database in the future where we can track player's profiles, game IDs, stats, etc
      - Tracking stats / history will allow us to also implement performance-based matchmaking, prioritizing better players against better players (more wins against better players, fewer losses against worse players, win streak, losing streak, number of total matches played online and offline, etc)
    2. Speed and Support
    - Our second requirement is to make a server capable of supporting hundreds or thousands of concurrent players
    - This would mean that scalability is now something that needs to be considered
    - e.g., 50 players doing solo 10v10 battles against bots, 10 players in 1v1 duels, 6 players idle on home screen, 3 logging in, 1 logging off, etc.
    - Prep for this will also put us on the right track to eventually have the 10 v 10 games being all players, while still supporting the large legions of mobs.
    - This should actively be planned for, but is not yet a hard requirement (not until sprint 3)

## Done

- 2026-10-10 — **Your chat clarifications of 2026-10-10 (DEC-11) and the source of the new
  requirements** recorded in `docs/reference/game-design/13-owner-decisions-log.md` (appended to
  DEC-11, DEC-36 and DEC-37) and applied to reference 01, 06, 08, 11, `more-abilities.md` and
  `docs/plan/legend-team-brief-2026-10-10.md`. Branch `docs/sprint-2-requirements-and-planning`,
  on top of `8d0d308` (your answers), `045ecc3` (the DEC records and the brief) and `3923124`
  (proposed ADR 0016 and ADR 0017, and the multiplayer plan).
  - **DEC-11 (1), pool or rule change, and does Sentinel keep Rip & Tear** (impact Q3): confirmed
    in chat, "a player chooses 3 abilities and 1 ultimate from the set of abilities and ultimates
    that are available to their class when selecting/creating their loadout". The "3 + 1" rule
    stands and the class set is a pool. Rip & Tear stays: the approvals come "on top of the
    abilities that i had originally put forward in the reference docs".
  - **DEC-11 (2), do Meteor Fall and Nova stay MVP** (impact Q4): confirmed in chat, yes. Every
    class keeps its game-doc kit (Warrior Veil, Blade Runner, Fury; Sentinel Rip & Tear, Slam,
    Berserk, Meteor Fall; Magus Imbue, Shockwave, Death Ray, Nova), all MVP, next to Eclipse,
    Avalanche and Last Rites.
  - **MVP status of Fan of Sorrows, Sunder, Colossus Roar, Aether Lance and the Sunder–Sanctuary
    combo:** confirmed in chat, "all of these for MVP".
  - **DEC-36 and DEC-37** were set by the course instructor ("our prof", an intentional
    curveball): planned now; must be implemented by the end of Sprint 3 (2026-11-13).
  - **Correction to the entry below:** the Session D follow-up (approving the SD-1/SD-2 text) was
    left only in Done; it is now an open item above. The open items above also gain the DEC-11
    architecture approvals, ADR 0016 and ADR 0017.
- 2026-10-10 — **The owner's answers of 2026-10-09 (`8d0d308`)** recorded in
  `docs/reference/game-design/13-owner-decisions-log.md` (batch 2026-10-10) and folded into the
  reference docs and `docs/plan/legend-team-brief-2026-10-10.md`. Branch
  `docs/sprint-2-requirements-and-planning`. What each item still needs stays open above.
  - **Session D — no `useAppDispatch`, and the 13 §2 `character-select` row** (DEC-34), fully
    answered: "Accept recommended option if it is cleaner long-term. For D, set to whichever is
    cleaner in the long-term." The edits to architecture 13 §2, §5 and `apps/client/AGENTS.md`
    wait for your approval of their text (impact review SD-1, SD-2).
  - **DEC-11**, the answered part: Hamstring and Fan of Sorrows (Warrior), Shield Wall, Sunder and
    Colossus Roar with fear (Sentinel), Sanctuary and Aether Lance (Magus), the alternate
    ultimates Eclipse, Avalanche and Last Rites, and "Sunder shatters Sanctuary", all MVP.
  - **DEC-12**, the answered part: both crystal timers are `TUNE` starting values; crystals turn
    volatile once the centre boss spawns; `insanity` is a description and an icon only for now.
  - **DEC-13**, the answered part: the planned match is 30 minutes, no hard time limit.
    `plannedMatchSeconds` in `packages/core/src/config/defaultGameConfig.ts` is not changed by this
    docs branch.
  - **DEC-15**, the answered part: camp classes by position in the corridor, positions drawn per
    side, equal counts per class on each side.
  - **PROTO-01**, the answered part (DEC-35): the escort is deleted this sprint in favour of real
    hordes; `AiSystem` means the game's bot AI.
  - **New requirements** (Feedback): Duel multiplayer (DEC-36) and server scalability (DEC-37)
    recorded; their questions are in `docs/plan/multiplayer-and-scalability-plan.md`.
- 2026-10-09 — **PR #24 review (SamarjitBhogal), reuse requests**: approved by sholtzman in chat
  for whatever is in line with or better than the architecture. Recorded as DEC-30 (`chordKey`
  moves to `bridge/`, better than the design) and DEC-31 (one shared `readOrQuarantine` instead of
  14 §8's private method per repository, also better than the design). The shared DTO helpers
  (`dto/dtoCheck.ts`) wait for S2's second DTO, as the review suggests; only `DtoCheck<T>` moved
  now, because `readOrQuarantine` needs it.
- 2026-10-09 — **Session C → session F: `Binding.types.ts` has the 13 §6.1 shapes** (PR #19):
  superseded by DEC-26 in F's merge `a82e098`. F's flat `InputChord` is kept, `INPUT_ACTIONS`
  lives in `game/input/keybindings.ts`, and #19's `DeviceIntentSource` builds F's snapshot.
- 2026-10-08 — **Session F owner decisions DEC-25…DEC-29** (agent pushes, canonical input layer,
  `SettingsController`, snapshot shape, conflict-free edits) recorded in
  `docs/reference/game-design/13-owner-decisions-log.md` and folded into ADR 0015 and
  architecture 02, 09 and 13 on `feat/settings-keybindings`.
- 2026-10-08 — **F → D: settings wiring in `main.tsx` and `ui/App.tsx`**: done on
  `feat/settings-keybindings` (owner-approved: the second branch to merge adds it, PR #12).
- 2026-10-08 — **F → D: settings intents and the `settings` event** (session F's request of
  2026-10-06): `update-binding` `onConflict`, per-action `reset-bindings`, `update-settings`,
  `BridgeEventMap.settings` and the `connectBusToStore` line landed in D's 5accc85 (PR #12).
- 2026-10-08 — **Session C's optional ideas** answered in the PR #14 review and done: one
  `EntityModule` per family declined (back to `createDefaultEntityRegistry()`, DEC-21);
  `ContentValidator` with rule classes accepted with fixes (rules get the catalogue, listed in
  `content/defaultContentRules.ts`, run once from `loadDefaultContent()`, DEC-22, folded into 04 §5
  and 05 §2–§3); `applyDamage` returning `{ toShields, toBase, overflow }` accepted (DEC-23, 07 §2);
  ADR 0013 split into its own PR (DEC-24). Recorded in
  `docs/reference/game-design/13-owner-decisions-log.md`. Branch
  `feat/entity-collider-and-concrete-kinds` (PR #14).
- 2026-10-08 — **DEC-16** (lint ignores agent worktrees) accepted by the owner in chat:
  `eslint.config.js` adds `.worktrees/` and `.claude/worktrees/` to `globalIgnores`; recorded in
  `docs/reference/game-design/13-owner-decisions-log.md` and ADR 0014. Branch
  `chore/lint-ignore-worktrees` (PR #20).
- 2026-10-07 — **Session B's simulation kernel items** signed off and done: the snapshot shape
  (DEC-17) and the `makeLogRecord` options object (DEC-18) folded into 03 §5 and 15 §4; the
  determinism lint (DEC-19, ADR 0012) added; the kernel's design differences (DEC-20) folded into
  02, 03, 15 and 17 R16, with "Implementation status" sections in 03 and 15; the replay fixture
  format written into 15 §7. Recorded in `docs/reference/game-design/13-owner-decisions-log.md`.
  Branch `feat/sim-kernel` (PR #13).
- 2026-10-07 — **Session A's requests to session B** done: `utils/deterministicMath.ts` (now used
  by `polarPoint`), `GameConfig.map` keeps the field names of the map's local `MapConfig`, and the
  nav cell size lives in `config.map.navCellSize`. Branch `feat/sim-kernel` (PR #13).
- 2026-10-06 — **DEC-14** (map generator refinements a–d) signed off by the owner; recorded in
  `docs/reference/game-design/13-owner-decisions-log.md` and folded into
  `docs/architecture/06-map-and-minimap.md`. Branch `feat/map-generator` (PR #8).
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

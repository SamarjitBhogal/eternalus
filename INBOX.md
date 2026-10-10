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
  -     Hamstring ability approved for Warrior class. Fan of Sorrows also approved. Eclipse alternate ultimate approved for MVP
    -   Shield wall, Sunder, and Colossus Roar approved for Sentinel class. Avalanche approved as alternate ultimate for MVP
    - Sanctuary and Aether Lance approved for Magus class (Enemy Sentinel's Sunder should shatter Sanctuary). Last Rites alternate ultimate approved for MVP. 
- [ ] **DEC-12 (was DISC-33) — corner-camp crystal timers.** "Crystals" are the unbreakable
      crystals inside the four **corner camps** (game doc, "Outer (Corner) Camps" and "Minion
      Buffs on Boss Spawn"): the crystal respawns the camp's mini-boss **300 s** after it dies,
      and once the central boss has spawned it also emits light/medium waves toward your lanes
      every **240 s**. Accept both timers as TUNE starting values? (Corner camps are first in the
      cut order, so this only matters if time allows.)
  -     Approved with this caveat: Onc the centre boss spawns, the outer camp's crystals become "volatile" and are now breakable but when they die, they release a shockwave destroying the camp and dealing massive AOE damage and temporary insanity debuff (TBD on what it does but the effect description/icon can be added with no actual effects applied)
- [ ] **DEC-13 (was DISC-34) — match length.** Left blank in the last batch. Proposal:
      `plannedMatchSeconds: 1200` (quarter mark 300 s → mini-bosses; mid-game 600 s → gem
      summons the boss), no hard time limit, optional score cap at 2700 s. Accept or give numbers.
  -     Accept after scaling to planned match time = 30 mins

- [ ] **DEC-15 — camp weights by depth (DISC-42) in practice.** The default map yields 4 light +
      2 heavy camps per side and no medium ones; with one camp per corridor (`numLanes` ≥ 7) every
      camp is heavy. Proposal: keep depth-based weights but define the classes by position in the
      corridor (nearest-lane camps light, middle medium, deepest heavy), or give the count per
      class in content. Pick one. Note: "depth" is the distance to the nearest lane over half the
      corridor's height, so in tall worlds with steep lanes every camp reads as light.
  -     Accepted " keep depth-based weights but define the classes by position in the corridor" where the vertical line down the centre of the map defines the division. RNG determines the location of the camps on each side so both sides are different, but they must equate in terms of overall difficulty (1 light on left means 1 light on right; not necessarily in mirrored locations but the same amount of weighted camps on left team and right team's sides)
- [ ] **Session D (feat/session-shell-home), better than design — no `useAppDispatch`.** The
      §2.3 contract and `apps/client/AGENTS.md` ask for `useAppSelector` **and**
      `useAppDispatch`. D ships only `useAppSelector`: `ui/` never writes the store
      (architecture 13 §5, "every state change has one path"; components call `emitIntent`), and
      knip fails the build on an unused export. Leaving the hook out makes the rule structural.
      Options: (a) **Recommended** — accept; update §2.3's successor, `apps/client/AGENTS.md`
      "Adding code" and architecture 13 §5 to say "`useAppSelector` only; the UI emits intents".
      (b) Add `useAppDispatch` back when a first caller exists.
      Also found by the critic: architecture 13 §2's `character-select` row says it "builds the
      rosters … assigns `playerTeam`", while the `menu` and `loading` rows (and reference 14 §5)
      put the setup at "Start match"; D follows the latter. The row needs a one-line fix.
  -     Accept recommended option if it is cleaner long-term. For D, set to whichever is cleaner in the long-term.

- [ ] **PROTO-01 — prototype escort minions (demo, 2026-10-08; branch `feat/minion-follow-prototype`).**
      For the prototype demo, Samarjit chose minions that **follow the player's Legend** instead
      of marching down lanes (option b). This is a **prototype decision to be replaced** by the
      real Phase 3 systems; it is not in the design docs and they were not changed. Stand-ins to
      remove: `ai/FollowLeaderController.ts` + `content/ai/followLeaderProfile.ts` (→
      `MinionController`, sprint 3.3), `content/mobs/lightMinion.ts` (health 150 and radius 0.4 are
      `balancing.md`'s light-minion anchors; please confirm two departures: speed 5.4 m/s instead
      of 3.5 so the escort keeps up with the Warrior, and mass 0.5 as 40 on the repo's Warrior =
      1 scale), the `PROTOTYPE_ESCORT` spawn in `apps/client/src/game/Match.ts` (→ `SpawnSystem` / hordes),
      the brute-force scan (→ `Perception` over `SpatialHash`), `Brain` as a component with only
      a controller id (→ `state.ai.brains`, 11 §2) and the missing `AiSystem` decision budget
      (11 §6). Question: `AiSystem` is a system (02 §2, 11 §1), but `systems/` may not import
      `ai/` (core `AGENTS.md`), so it lives in `ai/` and `Simulation` passes it to
      `DefaultSystemPipeline`, which splits the tick order across two files (02 §9). Should
      `AiSystem` stay in `ai/`, or may `systems/` import `ai/` types?
      Decision needed: keep the escort behind a dev flag after Phase 3, or delete it then?
      **Finding the code:** all prototype code is temporary. Every piece carries the marker
      `PROTOTYPE(PROTO-01) TEMPORARY`, followed by what replaces it; `git grep -n 'PROTOTYPE(PROTO-01)'`
      lists them all. Agents: do not build on or extend marked code; replace it with the named
      design piece. Proposal (needs your approval, since it edits `AGENTS.md`): add this marker
      convention to `AGENTS.md` so every future prototype uses it.
  -     Escorts to be deleted this sprint in favour of real hoards. The ai system mentioned here is unrelated to CLAUDE.md and AGENTS.md, but is instead meant as a stand-in for the Bot AI that will power the actions of the bots, neutral camps, bosses, and mobs

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

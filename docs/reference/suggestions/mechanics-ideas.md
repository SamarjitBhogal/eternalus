---
title: Mechanics ideas
description: Proposals that resolve or extend mechanics the sources leave open, including form change at buildings, the capital's summoner, pick-up/throw scope, the class-switch ultimate penalty formula, the Rover bot behaviour spec, sim mode as a first-class testing feature, achievement hooks, the match history record and the developer menu command list; read it before implementing any of these or when the product owner asks what the minimal version would be.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, suggestions, mechanics, ai, developer-menu, achievements, persistence]
paths:
  [
    'packages/core/src/ai/RoverController*',
    'packages/core/src/commands/**',
    'packages/core/src/match/**',
    'apps/client/src/ui/hud/DeveloperMenu*',
    'apps/client/src/data/persistence/dto/**',
  ]
related:
  - 'docs/reference/game-design/12-open-questions.md'
  - 'docs/reference/game-design/11-mvp-scope.md'
  - 'docs/architecture/11-game-ai.md'
  - 'docs/architecture/03-game-model.md'
  - 'docs/architecture/15-diagnostics-and-runtime-testing.md'
---

# Mechanics ideas

**Purpose.** Read this when a mechanic is named in the sources but not defined well enough to build, or when the requirements doc asks for a feature the game doc never describes (achievements, match history, the developer menu, sim mode). Each section states what the sources say, proposes the minimal version that fits the architecture (or a cut), gives numbers and formulas as `Recommendation:` unless marked `TUNE` with a source, and ends with what the product owner has to decide. Nothing here is a decision (`README.md`); accepted items move to `../game-design/12-open-questions.md` or an ADR.

## 1. Form change at buildings — needs-planning: propose the cut

**Sources.** Game doc, Form change: "works like entering a vehicle: the character morphs into a greater stature, and their abilities, attacks, and stats change. It is configurable, possibly class-dependent, and can only be done at specific locations." Ascendance (attack) at SpawnerTowers, Enchantment (rename pending; **Benediction** in `naming.md`) (support) at BuffTowers, both at the Stronghold. The whole Buildings column and both rows are yellow (`[STATUS: needs-planning]`); the Eternal row is not, and brief decision D12 files form change as **post-MVP**. Open questions OQ-20 (keep it?) and OQ-21 (class-dependent?).

**Recommendation: cut form change from the MVP, and build the Eternal form with the mechanism form change will use later.** The Eternal form (final hit on the GreaterBoss, **MVP-if-time**) already needs "abilities, attacks and stats change" for one Legend. If that is implemented as a **definition swap**, form change at buildings later is content plus one interaction class, which is the product owner's litmus test.

```ts
// packages/core/src/content/forms/warriorEternal.ts (sketch; folder proposed)
export const ASSAULT_ETERNAL = {
  id: 'warrior-eternal',
  displayName: 'Eternal', // rename pending (OQ-06)
  forClassId: 'warrior',
  statMultipliers: { maxHealth: 3, damage: 2, abilityPotency: 1.5, size: 1.5 }, // balancing.md
  controlResistance: 0.25, // knockback and stun durations × 0.25 (game doc: reduction)
  abilityIds: ['veil-prime', 'blade-runner-prime', 'hamstring-prime'],
  ultimateId: 'fury-prime',
  sprite: { atlas: 'legends', key: 'warrior-eternal' },
  endsOn: ['death'], // form change adds 'timer' and 'interact'
} satisfies FormDefinition;
```

- The `Loadout` component gains `formId: FormId | null`; `AbilitySystem` and the `DamagePipeline` read the active form's multipliers and ability ids through the `ContentCatalogue`; `SnapshotSystem` exposes `formId` so views and the HUD switch sprite and ability glyphs. No new entity class, no fourth inheritance level (D11): a form is data consumed by the class, exactly like a sub-class specialization.
- Applying a form is an event handler (`entity-died` of the GreaterBoss with the final-hit source) that emits `form-applied`; ending it is `DeathSystem`'s job (`endsOn: ['death']`; the game doc: "they die once their health bar is depleted", no revive back to Eternal).
- **The post-MVP recipe** (when OQ-20 is decided "keep"): one `FormChangeInteraction` class registered in the structure interaction registry (`../../architecture/07-structures-obstacles-and-destructibles.md` §14 already reserves an `Interactable` on Stronghold/BuffTower) plus `<class>-ascendance` and `<class>-benediction` form definitions. Minimal rules for that version, so nobody designs against a bigger one: interact within 6 m of the building (default `interact` key), a 3 s channel, costs a full aether bar, at most one change per life, all cooldowns reset on change (the game doc's "changing abilities or ultimate resets cooldown"), the form ends on death or after 120 s, and forms are class-dependent (OQ-21: yes, because a form is a per-class definition; a class-independent form is just one definition with `forClassId: 'any'`).

**Owner decides:** accept the cut (recommended, consistent with D12), or ask for the minimal version in MVP-full at the cost of one sprint in Phase 4.

## 2. The summoner held by the capital (OQ-17)

**Sources.** Game doc, Buildings: the capital "holds the summoner (to be defined)"; Open Questions: "Define the summoner held by the capital. Does it do anything?" Requirements doc: 48 units at match start spawn from the stronghold.

**Recommendation: the summoner is the Stronghold's `Spawner` component with a display name** (Wellspring, `naming.md`): it is the source of the three opening hordes and, per `balancing.md` Option A, of the heavy reinforcements every 180 s to the worst-off lane and of the corner-camp reward waves. In the MVP it does nothing else. Options:

| Option              | The summoner is                                                                                                        | MVP cost           | Notes                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **A (recommended)** | The `Spawner` component on `Stronghold`, named in content                                                              | none               | Already required for the opening 48; "does it do anything?" is answered with the reinforcement waves                    |
| B                   | A plus an `Interactable` altar inside the walls where blessings are upgraded and forms are changed                     | none now           | The post-MVP hook the game doc already implies ("visiting a buff tower or the stronghold"); one interaction class later |
| C                   | A destructible sub-structure inside the Stronghold whose death stops reinforcements before the Stronghold itself falls | one structure kind | An extra siege objective; `post-MVP`, fits the "new idea = new class + content entry" recipe                            |

## 3. Pick-up and throw: scope for the MVP

**Sources.** Game doc, Default interactives: "All units can pick up and throw objects ... The heavier the object, the slower you move while holding it. Some things are too heavy for certain classes." Levitate (medium max, pull or throw), Grab (high max, picking up enemies applies "crushed"), Pick Up (low max, suplex an enemy Warrior from behind), Grasp (Flying, post-MVP). Map: felled trees "can be picked up by strong enough characters, depending on tree size". The requirements MVP list never mentions it, so the reference docs mark it **MVP-if-time**, and the plan's cut order puts it second (`../../plan/README.md` §4).

**Recommendation: three tiers, ship tier 1 in MVP-full, defer tier 2.**

| Tier                | Scope                                                                                                                                                   | Needs                                                                                                                                                                                 | Status                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 0                   | No pick-up. The `interact` action only enters turrets.                                                                                                  | nothing                                                                                                                                                                               | MVP-core                                                 |
| **1 (recommended)** | Carry and throw **obstacles only**: felled trunks, wall chunks (from destroyed `WallSegment`s), boulders. Levitate pulls the object to the Magus first. | `Carry` component, `PickUpStrategy` per class (`LightPickUpStrategy`, `GrabPickUpStrategy`, `LevitatePickUpStrategy`), `Carryable` obstacles, a thrown obstacle as a swept projectile | **MVP-if-time**                                          |
| 2                   | Pick up **units**: Grab (crushed), Pick Up (suplex finisher), Grasp (stun, "they can soon fight you off"), the Sentinel's Grasp parry                   | A "held" control state on the victim, an escape rule, parry interplay, the Flying class for Grasp                                                                                     | post-MVP (matches `../../architecture/10-physics.md` §3) |

Numbers for tier 1 (`Recommendation:`, masses in the units `balancing.md` uses: light minion 40, medium 90, heavy 250, Sentinel 400):

| Rule                     | Formula or value                                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carry capacity           | Warrior 60 (low), Magus 150 (medium), Sentinel 500 (high)                                                                                                         |
| Object weights           | felled sapling 40, felled oak trunk 120, boulder 200, wall chunk 300; a `weight` field on `ObstacleDefinition`                                                    |
| Can pick up              | `object.weight <= carrier.capacity` (the game doc's "a Tank can pick up a wall chunk; an Warrior cannot": 300 > 60)                                               |
| Speed while carrying     | `maxSpeed × (1 − 0.5 × weight / capacity)` (the game doc's "the heavier, the slower")                                                                             |
| Throw range              | `2 + 8 × (1 − weight / capacity)` metres, along the aim; Levitate throws 25% further                                                                              |
| Impact                   | Physical damage `0.4 × weight` in a radius of the object's footprint, knockback impulse `weight × 4`, structure multiplier 1.0 (a hurled wall chunk hurts a gate) |
| Pick-up time             | 0.5 s channel; the object's collider is disabled while carried and re-enabled with a swept test on release                                                        |
| Abilities while carrying | Restricted by `not-while-carrying` (Blade Runner, Slam, Hurl empty-handed); basic attacks throw the object                                                        |

Bindings: `interact` (default E, `../game-design/09-controls.md`) picks up or drops; `attack` throws. Tier 2 later reuses every piece and adds a `held` status (`more-abilities.md` §7 `crushed`) and a `struggle` input.

**Owner decides:** confirm tier 1 as the MVP-full target and tier 2 as post-MVP (DISC-60 in `discrepancies.md`).

## 4. The class-switch ultimate penalty (OQ-31) — post-MVP, formula now

**Sources.** Game doc, Ultimate Abilities: "Switching classes sets your ult back 50–100% on cooldown (toward the just-used side, never reducing the cooldown), so players cannot build up a charge and then switch classes next life. Needs work." In the MVP the class is fixed for the match (`../game-design/06-abilities-and-progression.md`), so the rule is **post-MVP**; the formula is proposed now so `Progression` stores what it needs (the ultimate meter and the tick of the last ultimate cast are per Legend, not per class).

Reading the sentence: "50–100%" is a range, "toward the just-used side" means the penalty is heavier the more recently the ultimate was used, and "never reducing the cooldown" means a switch can never leave the player closer to an ultimate than before.

```text
penalty(t)  = clamp(0.5 + 0.5 × (1 − t / W), 0.5, 1.0)     t = seconds since the last ultimate cast, W = 120 s (Recommendation)
meterAfter  = meterBefore × (1 − penalty(t))                  always ≤ meterBefore
```

| Seconds since last ultimate | Penalty | Meter kept |
| --------------------------- | ------- | ---------- |
| 0 (just used it)            | 100%    | 0%         |
| 30                          | 87.5%   | 12.5%      |
| 60                          | 75%     | 25%        |
| ≥ 120                       | 50%     | 50%        |

Plus: every ability of the new class starts on full cooldown (the game doc's "changing abilities or ultimate resets cooldown"), switching is impossible while an ultimate is active, and switching is allowed only while dead (during the respawn timer) or inside the Stronghold aura, so the "build a charge, switch next life" exploit is closed twice. Options: **A (recommended)** the formula above; B flat reset to 0% on any switch (the simplest reading of "100%"); C no formula, only the location and respawn restriction with a flat 50%. All three are the same content shape: `classSwitchPenalty: { minFraction, maxFraction, windowSeconds }` in `content/progression/`.

**Owner decides:** the shape (A, B or C); values are `Recommendation:` starting points for balancing.

## 5. Rover bot behaviour spec

**Sources.** Game doc: "Three lanes, with 3 players per lane plus 1 Rover per team"; "The enemy Rover is a hard bot: it reacts to structure health and mirrors or targets the player"; MVP decision: "All non-player characters are bots, including the enemy Rover." The architecture reserves `RoverController` in `packages/core/src/ai/` with cadence 3 ticks and the `rover` difficulty preset (`../../architecture/11-game-ai.md` §4.7).

**Goal.** The Rover is the tenth Legend on each team and the only one not bound to a lane. The enemy Rover exists to make the human's life hard in a way the human can read: it shows up where the human is winning, hunts when the human is weak, and defends the structure the human is hitting.

**Inputs** (all read through `Perception` and team state; no scanning of `state.entities`):

- `laneHealth[lane]`: allied structure health on that lane as a fraction of max, and `laneDamageRate[lane]`: damage taken by those structures in the last 10 s (from `damage-applied`).
- `laneThreat[lane]`: enemy Legends and hordes within 20 m of an allied structure on that lane.
- `target`: the human Legend (`state.match.humanLegendId`) for the enemy Rover; for the allied Rover, the enemy Legend with the highest threat score (below).
- The target's position, lane, health fraction, level, allies within 12 m, and whether it stands inside an enemy turret's range.
- Own health, aether, cooldowns and the nearest allied structure.

**Modes**, scored every 3 ticks by a utility scorer, with 3 s of hysteresis (`modeHysteresisTicks`) so the Rover never flips between modes while running:

| Mode          | Enter when                                                                                          | Behaviour                                                                                                                                                      | Leave when                                       |
| ------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Retreat**   | own health < `retreatHealthFraction`                                                                | Path to the nearest allied structure aura; Sanctuary or Iron Hide if available                                                                                 | health > 60%                                     |
| **Defend**    | `max(laneAlarm)` ≥ `structureAlarmThreshold`                                                        | Go to the most alarmed allied structure; fight inside its aura; prefer the target if it is there ("reacts to structure health")                                | the alarm drops below half the threshold for 5 s |
| **Hunt**      | `advantage(target)` ≥ `huntAdvantageThreshold` and the target is reachable within 15 s at max speed | Intercept the target's predicted position; open with the burst ability; disengage when `advantage` < 0 ("targets the player")                                  | `advantage` < 0 or the target dies               |
| **Mirror**    | default when the target is alive                                                                    | Shadow the target's lane on the Rover's own side, keeping `mirrorDistance` (18 m) between them, so it can Hunt or Defend within seconds ("mirrors the player") | Hunt or Defend triggers                          |
| **Objective** | a mini-boss or the GreaterBoss is alive and ≥ 3 allied Legends are within 15 m of it                | Join the boss fight; stay behind allies                                                                                                                        | the boss dies or allies leave                    |
| **Push**      | the target is dead or unreachable and no alarm                                                      | Push the lane with the highest `laneAdvantage` (enemy structure health lowest, allied horde closest); capture points on the way                                | any other mode triggers                          |

Formulas (`Recommendation:`; every constant is content):

```text
advantage   = (hpRover − hpTarget) + 0.10 × (lvlRover − lvlTarget)
            + 0.15 × (alliesNearRover − alliesNearTarget) − 0.30 × [target under an enemy turret]
laneAlarm   = laneDamageRate[lane] / maxStructureHealth[lane] × 10 + 0.5 × [a structure on the lane has no shield bars]
threat(L)   = damage dealt by enemy Legend L to allied Legends and structures in the last 30 s / 1000 + 0.2 × lvl(L)
```

**Difficulty knobs** (`content/ai/profiles/rover.ts`; the `rover` preset per `../../architecture/11-game-ai.md` §4.2, all `Recommendation:` starting points, provisional in content):

| Knob                      | `rover` (hard) | `normal` | `easy` | Meaning                                               |
| ------------------------- | -------------- | -------- | ------ | ----------------------------------------------------- |
| `cadenceTicks`            | 3              | 6        | 10     | How often the Rover re-decides                        |
| `reactionDelayTicks`      | 6              | 12       | 24     | Delay between seeing a change and acting on it        |
| `aimErrorRadius`          | 0 m            | 0.5 m    | 1.2 m  | Skillshot error (Hamstring, Aether Lance)             |
| `abilityUseChance`        | 1.0            | 0.7      | 0.4    | Chance to use a ready ability when the scorer says so |
| `retreatHealthFraction`   | 0.25           | 0.35     | 0.5    | Retreat mode threshold                                |
| `huntAdvantageThreshold`  | 0.2            | 0.4      | 0.7    | Lower = hunts sooner                                  |
| `mirrorDistance`          | 18 m           | 24 m     | 30 m   | Shadowing distance in Mirror mode                     |
| `structureAlarmThreshold` | 0.15           | 0.25     | 0.4    | Lower = defends sooner                                |
| `modeHysteresisTicks`     | 90             | 120      | 180    | Minimum ticks before a mode change                    |
| `targetHumanBias`         | 1.5            | 1.2      | 1.0    | Multiplies the target's weight in target selection    |

**The allied Rover** (unspecified in the sources; DISC-51): `Recommendation:` the same `RoverController` with the target selected by a `TargetSelectionStrategy` (`human` for the enemy Rover, `highest-threat-enemy` for the allied one). That satisfies `../game-design/02-entities-and-units.md` (highest-threat target) and keeps one controller; `../../architecture/11-game-ai.md` §4.7's alternative (allied Rover runs `BotLegendController` with a `rover` role) is Option B and is a one-line content change either way.

Sketch of what the brain remembers (plain data, hashed and replayed like everything else):

```ts
// packages/core/src/ai/RoverController.types.ts (sketch)
export type RoverMemory = {
  readonly mode: 'retreat' | 'defend' | 'hunt' | 'mirror' | 'objective' | 'push';
  readonly modeSinceTick: number;
  readonly targetId: EntityId | null;
  readonly focusLane: number | null;
  readonly lastAdvantage: number;
};
```

**Tests** (scenario tests in `ai/scenarios/`): a SpawnerTower under attack with the Rover in Mirror mode → Defend within `reactionDelayTicks + path time`; the human at 20% health alone → Hunt; the human at full health with two allies → Mirror and the distance stays ≥ `mirrorDistance`; no mode flip inside `modeHysteresisTicks`; two runs with the same seed produce the same mode log.

**Owner decides:** whether the allied Rover mirrors the enemy's best Legend (recommended) or plays a defensive laner (Option B); the knob values are balancing.

## 6. Sim mode as a first-class testing feature

**Sources.** Requirements doc, developer menu: "sim game (remove/add user controlled Legend)"; MVP list: "10 v 10 Legends, all bots except 1 user controlled character". Architecture: `../../architecture/11-game-ai.md` §7 and the plan's Phase 3 sprint 3.8.

**Definition.** A match is in sim mode when no Legend has the `player` controller (`state.match.humanLegendId === null`). Every Legend runs `bot-legend` or `rover`, nobody reads input, and the match plays itself. Sim mode is not a debug hack: it is the substrate of every headless test and of balancing, and it is how the developer menu "removes the user-controlled Legend".

**What it is used for** (all **MVP**):

| Use                                           | Where                                                     | What it proves                                                             |
| --------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| Soak tests                                    | `npm run test:soak`, headless in Node, `heavy` invariants | Zero invariant violations over 18,000 ticks at 144 units per team          |
| Determinism with AI                           | replay fixtures, hash every 100 ticks                     | Same seed, same command log, same hashes, with 20 bot brains rolling       |
| Balance harness                               | `BalanceHarness` (`balancing.md` "How to test balance")   | Win rate 50% ± 5% on mirrored teams; match length and class matrix metrics |
| Bot-vs-bot CI gate                            | Phase 3 exit criterion                                    | A sim match reaches a `MatchResult` inside the timeline cap                |
| Developer menu toggle                         | `DeveloperMenu` → command                                 | Remove or re-add the human mid-match without restarting                    |
| Attract mode (`Recommendation:`, MVP-if-time) | Main menu "Watch a simulated match"                       | A demo that runs itself at the course presentation while someone talks     |

**Mechanics.**

- One command, replayable: `dev-set-controller { entityId, controllerId }`. Removing the human = set its Legend's controller to `bot-legend`; adding = set a chosen Legend (or one spawned with `dev-spawn-legend`) to `player`. `applyCommand` refuses a second `player` while one exists and emits `command-rejected`. The two architecture docs formerly named this command differently (`dev-set-sim-mode` in `../../architecture/03-game-model.md`, `set-controller` in `../../architecture/11-game-ai.md`); both now use `dev-set-controller`, recorded as DISC-56 (resolved).
- The camera and HUD follow a **spectated** Legend: `PlayerSnapshot` is built for `spectatedLegendId`, which equals `humanLegendId` when there is one and is selectable from the developer menu otherwise. The `PlayerController` is the only thing that differs, so the HUD needs no sim-mode branch.
- Headless entry point, in core so tests and the balance harness share it:

```ts
// packages/core/src/diagnostics/runSimMatch.ts (sketch)
export type SimMatchOptions = {
  readonly seed: number;
  readonly config: GameConfig;
  readonly content: ContentCatalogue;
  readonly profiles: Readonly<Record<TeamId, AiProfileId>>;
  readonly maxTicks: number; // safety cap; the match normally ends by victory
  readonly assertLevel: AssertLevel;
};
export function runSimMatch(options: SimMatchOptions): MatchReport; // MatchResult + metrics + hash checkpoints
```

- Rules: a sim match's `MatchResult.hadHuman` is false, so achievements are not evaluated and the match is stored in match history only when the profile setting "record simulated matches" is on (`isSimulation: true`, §8). Re-adding the human sets `hadHuman` to true for the rest of the match; achievements evaluated post-match use only counters accumulated while the human was attached (the counters are per Legend, so this is a filter, not a new counter).

**Owner decides:** nothing blocking; attract mode is the only optional piece.

## 7. Achievements and medals: hooks and ten cheap achievements

**Sources.** Requirements doc, boot menu: "profile ... match history (match id, character scores, achievements/medals (achievements currently don't exist; should be an easy add)". `naming.md` proposes **Deeds** for the system and **Marks** (iron, silver, gold) for the tiers. The plan lists achievement hooks as cut line 7 (`../../plan/README.md` §4), so the design must cost almost nothing when it stays in.

**Recommendation: evaluate achievements post-match from the counters the match already keeps; announce a few live.** `Scoring` (in `packages/core/src/match/`) already accumulates per-Legend counters from `GameEvents` for the "character scores" the requirements doc wants; an achievement is a pure predicate over those counters plus a handful of timeline facts. That keeps the per-tick cost at zero, keeps achievements deterministic and replay-derivable, and makes "an easy add" literal: a new achievement is one content entry.

```ts
// packages/core/src/content/achievements/wallbreaker.ts (sketch; folder proposed)
export const WALLBREAKER = {
  id: 'wallbreaker',
  displayName: 'Wallbreaker',
  description: 'Breach a Stronghold wall at full sprint.',
  tier: 'silver', // 'iron' | 'silver' | 'gold' (Marks)
  when: 'live', // 'live' (announced as it happens) | 'post-match'
  predicate: { counter: 'wallsBreached', atLeast: 1 },
} satisfies AchievementDefinition;
```

`evaluateAchievements(result: MatchResult, catalogue) → readonly AchievementId[]` runs in core at match end; the client's `ProfileRepository` stores `{ id, matchId, unlockedAt }` in one Unit of Work with the match record. Live ones are the same definitions evaluated by a listener on the counter's event; the `Announcer` shows them.

Ten achievements that are cheap to detect from existing `GameEvents` and counters (`Recommendation:`; names in the game's tone; all **MVP-if-time** with the hook, which is cut line 7):

| ID                        | Name                    | Mark   | Trigger (event)                                   | Predicate                                                                               | Live / post |
| ------------------------- | ----------------------- | ------ | ------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------- |
| `first-blood`             | First Blood             | iron   | `entity-died` (victim family `legend`)            | The first Legend death of the match has the player as its `DamageSource`                | live        |
| `wallbreaker`             | Wallbreaker             | silver | `wall-breached` (Sentinel sprint, `balancing.md`) | `wallsBreached ≥ 1` for the player                                                      | live        |
| `siegebreaker`            | Siegebreaker            | silver | `structure-destroyed`                             | The player dealt ≥ 30% of the damage to 3 destroyed structures (`damage-applied` share) | post        |
| `unbroken`                | Unbroken                | gold   | `match-ended`                                     | Player's team won and the player's `deaths === 0`                                       | post        |
| `warden-of-the-cathedral` | Warden of the Cathedral | silver | `capture-point-owner-changed` (Cathedral)         | The player's team held the Cathedral ≥ 300 s cumulative (`capturesHeldTicks`)           | post        |
| `godslayer`               | Godslayer               | gold   | `entity-died` (victim kind `greater-boss`)        | The final hit is the player's (the same fact that grants the Eternal form)              | live        |
| `hordebreaker`            | Hordebreaker            | iron   | `entity-died` (victim family `mob`)               | `minionKills ≥ 100` for the player in one match                                         | post        |
| `lazarus`                 | Lazarus                 | silver | `entity-revived` (emitted by `ReviveEffect`)      | `revives ≥ 5` by the player (Magus)                                                     | post        |
| `point-taken`             | Point Taken             | iron   | `checkpoint-cleared` ×3 on one point              | All three checkpoints cleared with the player present and `contestedBy` never set       | live        |
| `ascension-denied`        | Ascension Denied        | iron   | `entity-died` (victim has status `ascended`)      | The player kills an ascended minion                                                     | live        |

Counters this needs on `LegendStats` beyond kills/deaths/assists: `minionKills`, `structureDamage` and a per-structure damage share, `structuresDestroyed`, `wallsBreached`, `revives`, `checkpointsWon`, `capturesHeldTicks` per point; every one is also a "character score" input, so nothing is added only for achievements. A turret-kill achievement ("Bolt from the Wall", 10 kills from a manually controlled turret) waits for manual turret control (**MVP-if-time**).

**Owner decides:** accept the post-match model (recommended) and the Deeds/Marks names (DEC-08 in `INBOX.md`).

## 8. Match history record contents

**Sources.** Requirements doc: match history with "match id, character scores, achievements/medals"; loadouts "saved to the users profile". Research: repositories, DTOs, one `readwrite` transaction per save, replays as seed plus command log (`../../research/persistence-input-diagnostics-research.md#a3-patterns-repository-unit-of-work-facade-dtos-migrations-replays`). Architecture: `MatchResult` is produced by `MatchDirector` (`../../architecture/03-game-model.md`), persisted through `PersistenceController` (D3).

**Recommendation:** core produces the deterministic part (`MatchResult`), the client wraps it with identity and time and stores it as a versioned DTO in the `matches` store (index `by_profile_and_date`); the replay goes to the `replays` store under the same id, evicted first on quota pressure.

```ts
// apps/client/src/data/persistence/dto/MatchHistoryRecordDto.ts (sketch)
export type MatchHistoryRecordDtoV1 = {
  readonly schemaVersion: 1;
  readonly id: string; // crypto.randomUUID() in the client; the "match id" the requirements doc asks for
  readonly profileId: string;
  readonly playedAt: number; // wall-clock ms; client only, core never sees it
  readonly durationTicks: number;
  readonly tickRate: number;
  readonly seed: number;
  readonly mapPresetId: string;
  readonly configHash: number; // FNV-1a of the GameConfig, so a replay can refuse a mismatched config
  readonly coreVersion: string;
  readonly contentVersion: string;
  readonly isSimulation: boolean; // §6
  readonly result: {
    readonly winner: TeamId | null;
    readonly condition: 'stronghold-destroyed' | 'score-cap' | 'forfeit' | 'aborted';
    readonly playerTeam: TeamId;
    readonly playerWon: boolean;
  };
  readonly player: {
    readonly legendId: number;
    readonly classId: string;
    readonly loadout: LoadoutDtoV1;
    readonly finalLevel: number;
  };
  readonly legends: readonly LegendScoreDtoV1[]; // 20 rows, see below
  readonly teams: Readonly<
    Record<
      TeamId,
      {
        readonly score: number;
        readonly structuresDestroyed: number;
        readonly capturesHeldTicks: number;
        readonly bossKills: number;
      }
    >
  >;
  readonly timeline: readonly {
    readonly tick: number;
    readonly event: TimelineEventId;
    readonly actorId: number | null;
  }[];
  readonly achievements: readonly string[]; // unlocked in this match
  readonly replayId: string | null; // null when replay storage is cut or the replay was evicted
};

export type LegendScoreDtoV1 = {
  readonly entityId: number;
  readonly team: TeamId;
  readonly classId: string;
  readonly controller: 'player' | 'bot' | 'rover';
  readonly kills: number;
  readonly deaths: number;
  readonly assists: number;
  readonly minionKills: number;
  readonly damageDealt: number;
  readonly damageTaken: number;
  readonly healing: number;
  readonly structureDamage: number;
  readonly structuresDestroyed: number;
  readonly checkpointsWon: number;
  readonly revives: number;
  readonly ultimatesCast: number;
  readonly finalLevel: number;
  readonly score: number; // balancing.md scoring values: kill 1, structure 5, capture 3 per checkpoint, hold 1 per minute (Recommendation)
};
```

`TimelineEventId` is `'first-blood' | 'first-structure-destroyed' | 'mini-boss-killed' | 'greater-boss-summoned' | 'greater-boss-killed' | 'wall-breached' | 'eternal-ascended' | 'match-ended'`, enough for the Chronicle screen to show a match summary line without loading the replay. Size: about 3 KB per record (20 legend rows of 17 numbers), so a thousand matches are 3 MB; replays are the large records and are evicted first (research A, "What this means for Eternalus" item 4). Migrations: a `schemaVersion` bump plus a migration step in `schema/migrations.ts`; the `MatchHistoryRepository` maps DTO ↔ core `MatchResult` at the boundary and never stores class instances.

**Owner decides:** whether simulated matches are recorded by default (recommended: off) and whether replays are stored by default (cut line 9 in the plan).

## 9. Developer menu: the feature list, all replayable commands

**Sources.** Requirements doc: "should be able to enable/disable developer menu in-game: add/remove legends (max 10); spawn mobs from different origin points (max 144 units per team; shouldn't crash ...); sim game (remove/add user controlled Legend)"; runtime monitoring: "an ongoing game should have constant monitoring and logging of issues". Architecture: `dev-*` commands are ordinary members of the `Command` union so they appear in the replay log and respect the caps (`../../architecture/03-game-model.md` §3); the overlay pattern is in `../../research/persistence-input-diagnostics-research.md#c2-structured-logging-timing-memory-and-a-developer-overlay`.

**The rule.** Anything that changes simulation state is a `Command` through `Simulation.enqueueCommand`, validated by `applyCommand` (caps, liveness), rejected with `command-rejected` instead of throwing, and therefore recorded in the replay. Anything that changes only how the client shows or paces the simulation is a client-side toggle and is deliberately **not** in the log (a replay must not depend on the time scale of the machine that recorded it). `DeveloperMenu` (`apps/client/src/ui/hud/`, named **Architect's Table** in `naming.md`) is enabled by a setting plus the `?dev=1` query flag (Phase 1) and is off by default in release builds.

| Feature                           | Mechanism                                                                                                                                                                    | Cap / validation                                                                                                                                    | In the replay            | Status                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------- |
| Add a Legend                      | `dev-spawn-legend { team, definitionId, controllerId, at? }`                                                                                                                 | `maxLegendsPerTeam` (10 `TUNE`, requirements) → `command-rejected`; loadout = auto-build                                                            | yes                      | **MVP**                                 |
| Remove a Legend                   | `dev-remove-legend { entityId }`                                                                                                                                             | Refused for the human Legend unless the match is in sim mode                                                                                        | yes                      | **MVP**                                 |
| Spawn mobs from origin points     | `dev-spawn-mobs { team, definitionId, count, origin }`, `origin` = a structure id (Stronghold, SpawnerTower, BuffTower, Camp), a `{ lane, t }` or a world point (the cursor) | `maxUnitsPerTeam` (144 `TUNE`): the count is clipped, `spawn-suppressed` counted, never a crash; spawns are staggered one per tick like real hordes | yes                      | **MVP**                                 |
| Sim mode: remove or add the human | `dev-set-controller { entityId, controllerId }` (§6)                                                                                                                         | At most one `player` controller                                                                                                                     | yes                      | **MVP**                                 |
| Invariant level                   | `dev-set-assert-level { level: 'off' \| 'light' \| 'heavy', heavyEvery? }`                                                                                                   | —                                                                                                                                                   | yes                      | **MVP**                                 |
| Jump the match timeline           | `dev-set-phase { phase }` (Phase 3 uses it to reach the quarter mark and mid-game quickly)                                                                                   | Only forward; the `MatchDirector` runs the skipped entries' spawns                                                                                  | yes                      | **MVP-if-time**                         |
| Grant XP / set level              | `dev-grant-xp { entityId, amount }`                                                                                                                                          | Level cap                                                                                                                                           | yes                      | **MVP-if-time**                         |
| Invulnerability                   | `dev-set-invulnerable { entityId, on }` (a `StatusEffect` with no expiry)                                                                                                    | —                                                                                                                                                   | yes                      | **MVP-if-time**                         |
| Kill or destroy an entity         | `dev-kill { entityId }` → `RemovalCause: 'dev-removed'`                                                                                                                      | Not the human while attached                                                                                                                        | yes                      | **MVP-if-time**                         |
| Re-team a unit                    | `dev-set-team { entityId, team }` (exercises D10)                                                                                                                            | —                                                                                                                                                   | yes                      | **MVP-if-time**                         |
| Teleport                          | `dev-teleport { entityId, to }` (a swept move, so walls still log anomalies)                                                                                                 | Inside the world bounds                                                                                                                             | yes                      | **MVP-if-time**                         |
| Pre-match config overrides        | A form on the pre-match panel that edits `GameConfig` (`numLanes`, tower counts, caps, seed) before `Simulation` is built                                                    | `validateGameConfig` errors are shown inline                                                                                                        | as the replay's `config` | **MVP** (the D7 litmus test demo)       |
| Perf overlay                      | Client toggle (`PerfOverlay`: tick and frame histograms, long-animation-frame, memory sample, system budget)                                                                 | —                                                                                                                                                   | no                       | **MVP**                                 |
| Invariant and log tail overlay    | Client toggle over the `RingBufferSink` (last violations with tick, seed, entity, recent commands and events)                                                                | —                                                                                                                                                   | no                       | **MVP**                                 |
| Time scale                        | Client toggle on `GameLoop.timeScale` ∈ {0 (pause), 0.25, 1, 2, 4} plus "step one tick"; the simulation never knows (`balancing.md` "human sanity")                          | —                                                                                                                                                   | no                       | **MVP** (`Recommendation:` it is cheap) |
| Hash now / dump replay            | Client actions calling `Simulation.hash()` and `Simulation.exportReplay()` (download as JSON; the bug-report format)                                                         | —                                                                                                                                                   | no (they read only)      | **MVP**                                 |
| Spectate a Legend                 | Client selection of `spectatedLegendId` (§6)                                                                                                                                 | —                                                                                                                                                   | no                       | **MVP** with sim mode                   |

Why the split matters: a replay that contains `dev-spawn-mobs` reproduces the 300-unit stress scenario on any machine (the Phase 1 exit test), while a replay that contained "time scale × 4" would reproduce nothing. Cheats flowing through `applyCommand` also means the caps can never be bypassed, which is the requirements doc's "shouldn't crash" made structural.

**Owner decides:** nothing blocking; the MVP-if-time rows are ordered by how much they save during Phase 3–4 debugging (phase jump first).

## 10. Cross-cutting engineering notes

- Every proposal here is content plus at most one class: a `FormDefinition` (§1), a `Spawner` display name (§2), three `PickUpStrategy` classes that the architecture already lists (§3), a progression content block (§4), one `RoverController` plus its profile (§5), one command plus a headless runner (§6), achievement definitions plus one pure evaluator (§7), one DTO plus one repository (§8), `dev-*` union members plus `applyCommand` cases (§9). None changes a system's responsibilities.
- Determinism: nothing here reads the wall clock inside core; `playedAt` and `id` are client-side; the Rover's rolls come from its brain's `Rng` stream; time scale lives in `GameLoop`.
- Invariants to add with these features: at most one `player` brain; `spawn-suppressed` never exceeds 5% of attempted spawns in a soak; a `dev-kill` removal carries `RemovalCause: 'dev-removed'`; a form's ability ids exist in the catalogue.

## Related

- `README.md` — how a suggestion is accepted
- `../game-design/12-open-questions.md` — OQ-17 (summoner), OQ-20/21 (form change), OQ-24 (consumable), OQ-31 (class switch), OQ-61 (revive eligibility)
- `../game-design/11-mvp-scope.md` — the developer menu and boot-menu structure the sources ask for
- `../game-design/01-classes-and-subclasses.md` — the pick-up interactives
- `../game-design/02-entities-and-units.md` — the Rover, unit caps and sim mode
- `../game-design/04-objectives-capture-points-and-bosses.md` — the Eternal form and the match timeline
- `balancing.md` — the numbers behind the summoner's waves, the Eternal multipliers and the balance harness
- `naming.md` — Wellspring, Benediction, Deeds and Marks, Architect's Table
- `more-abilities.md` — status IDs (`crushed`, `eternal`, `ascendance`) and the effect catalogue
- `discrepancies.md` — DISC-51 (allied Rover), DISC-56 (sim-mode command name), DISC-60 (unit pick-up scope)
- `../../architecture/03-game-model.md` — `Command`, `Replay`, `GameConfig`
- `../../architecture/11-game-ai.md` — `RoverController`, sim mode, difficulty data
- `../../architecture/14-persistence-and-resources.md` — repositories, DTOs, migrations
- `../../architecture/15-diagnostics-and-runtime-testing.md` — invariants, soak tests, the overlay
- `../../research/persistence-input-diagnostics-research.md` — A3 (replays, Unit of Work), C2 (developer overlay)
- `../../research/game-architecture-and-performance-research.md#7-game-ai-for-bots` — behaviour trees, utility scoring, cadence

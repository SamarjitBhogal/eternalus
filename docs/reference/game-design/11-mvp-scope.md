---
title: MVP scope
description: The MVP list from the requirements doc merged with the game doc's MVP decisions, every line tagged MVP, MVP-if-time or post-MVP, plus the long-term goals and the boot-menu structure; read it to check whether a feature is in scope before designing or building it.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-29
tags: [reference, game-design, mvp, scope]
related:
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/plan/README.md'
  - 'docs/plan/backlog-post-mvp.md'
---

# MVP scope

**Purpose.** Read this when you need a yes/no on scope. It merges the requirements doc's "MVP"
list with the game doc's "MVP decisions so far" and "included in MVP if possible" section, tags
every line, and lists the long-term goals and the boot-menu structure. It is a reference
summary: the binding catalogue with FR-/NFR- ids and traceability is
`../../requirements/06-mvp-requirements.md`, and the schedule is `../../plan/`.

## Tags

**MVP** = the MVP builds it. **MVP-if-time** = wanted, built if the schedule allows, never blocked
by the architecture. **post-MVP** = deliberately later; an extension point exists. **removed** =
not built; kept for history. Derivation rules are in `00-overview-and-status-legend.md`.

## The MVP list (merged)

Numbers are quoted from the sources and are `TUNE` (they live in `GameConfig`/content).

### World and match

| Item                                                                                                                                      | Tag             | Source                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------- |
| 3 lanes, kept straight                                                                                                                    | **MVP**         | requirements; game doc                   |
| 1 set of SpawnerTowers per team (1 per lane)                                                                                              | **MVP**         | requirements                             |
| 1 set of BuffTowers (also spawners) per team (1 per lane)                                                                                 | **MVP**         | requirements                             |
| Wall around the Stronghold per team (with gates and turrets)                                                                              | **MVP**         | requirements; game doc                   |
| Stronghold per team; destroying it wins                                                                                                   | **MVP**         | requirements; game doc                   |
| Buff-tower shield bars on structures; walls/gates breakable only after 2 BuffTowers down                                                  | **MVP**         | game doc (Stronghold Defenses)           |
| Turrets: auto-fire, manual with P, T to switch ammo, heavy/default bolts                                                                  | **MVP**         | game doc                                 |
| 3 central capture points (1 per lane) with three checkpoints; the middle one is the Cathedral                                             | **MVP**         | requirements; game doc                   |
| 6 forest camps per team side between the lanes (1 lane → 3 camps → middle lane → 3 camps → 1 lane); camps spawn only after their cooldown | **MVP**         | requirements                             |
| Camp weight class by position in the corridor; random positions per side with equal counts per class (ADR 0009 amendment pending)         | **MVP**         | DEC-15                                   |
| Neutral camps, bosses and mini-bosses as neutral units                                                                                    | **MVP**         | requirements                             |
| Mini-bosses on the outer capture zones at the quarter mark                                                                                | **MVP**         | game doc                                 |
| Planned match of 30 minutes; the quarter mark and mid-game scale with it; no hard time limit (score cap: 4050 s, to confirm)              | **MVP**         | DEC-13                                   |
| Central boss (Eternal) summoned by the Cathedral gem mid-game; Eternal form for the final hit                                             | **MVP-if-time** | game doc                                 |
| Outer (corner) camps with mini-bosses, crystal (volatile once the boss spawns, DEC-12), 5-minute respawn, heavy wave down the worst lane  | **MVP-if-time** | game doc ("included in MVP if possible") |
| Minion buffs on boss spawn; corner camps spawn side waves every 4 minutes                                                                 | **MVP-if-time** | game doc                                 |
| Volatile crystals: breaking one destroys its camp (shockwave, massive area damage, `insanity` debuff with no effect yet)                  | **MVP-if-time** | DEC-12                                   |
| Map + minimap, both generated from config; minimap follows the map with no code change                                                    | **MVP**         | requirements                             |
| Destructible bridges; burnable grass and trees; felled trees damage, break ground and can be carried                                      | **MVP-if-time** | game doc                                 |
| Multiple maps                                                                                                                             | **post-MVP**    | game doc (idea pending)                  |

### Units

| Item                                                                                                                         | Tag              | Source                                   |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------- |
| 10 v 10 Legends, all bots except 1 user-controlled Legend; 3 per lane + 1 Rover per team                                     | **MVP**          | requirements; game doc                   |
| 2 teams (light, dark): allied team, enemy team, randomly chosen for the player; neutral camps/bosses                         | **MVP**          | requirements                             |
| 3 classes (reference 01; the class files in `packages/core/src/content/legends/`)                                            | **MVP**          | requirements; game doc                   |
| Flying class, mounts                                                                                                         | **post-MVP**     | game doc (orange); brief D12             |
| Sub-classes (Legends): picked as setup data today (FR-119); the phase that builds their gameplay is open (`INBOX.md` HC-Q17) | **MVP** (DEC-56) | owner; brief D11                         |
| Minion hordes of 16 (light), 8 (medium), 4 (heavy)                                                                           | **MVP**          | requirements                             |
| Minions spawn from towers every 1 minute; 48 units at match start from the Stronghold (3 hordes, 1 per lane)                 | **MVP**          | requirements                             |
| 1-minute countdown from match initiation: nothing spawns from towers, only the 3 Stronghold hordes                           | **MVP**          | requirements                             |
| Minion strength scales with distance from home; enraged buff when a structure falls; zone level-up                           | **MVP**          | game doc                                 |
| Minion XP after two kills; ascend on a player kill                                                                           | **MVP-if-time**  | game doc                                 |
| Guards per structure; respawn every 2 minutes; never leave the perimeter                                                     | **MVP**          | game doc                                 |
| AI-controlled hordes, AI-controlled non-player units; enemy Rover as a hard bot                                              | **MVP**          | requirements; game doc                   |
| Entity stat set: health, speed, maxSpeed, acceleration, mass (Sentinel: low base speed, high maxSpeed, slow acceleration)    | **MVP**          | game doc ("included in MVP if possible") |
| Class character sizes (Warrior ≈ medium minion, Magus ≈ heavy minion, Sentinel very large)                                   | **MVP**          | game doc                                 |
| Max 10 Legends per team; max 144 units per team without crashing; engineered for hundreds                                    | **MVP**          | requirements                             |

### Legends, abilities, loadout

| Item                                                                                                       | Tag                                                 | Source                       |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------- |
| Simple XP-based scaling on abilities (blessings?), health and aether (aether = mana, spent after cooldown) | **MVP**                                             | requirements                 |
| 3 abilities + ultimate per class; ultimate charged by kills, assists, objective damage; lose N% on death   | **MVP**                                             | game doc                     |
| Approved abilities, alternate ultimates, Sunder–Sanctuary combo; class pools, loadout picks 3 + 1 (`06`)   | **MVP**                                             | DEC-11; chat 2026-10-10      |
| Ability upgrades on hold beyond basic level scaling                                                        | **MVP** decision (upgrades themselves **post-MVP**) | game doc (yellow)            |
| Ability tree; upgrading blessings at a BuffTower or the Stronghold                                         | **post-MVP**                                        | game doc (idea pending)      |
| Simple loadout options (weapons, some ability options); pre-game configuration with auto-build             | **MVP**                                             | requirements; game doc       |
| Loadouts saved to the user's profile                                                                       | **MVP**                                             | requirements                 |
| Mid-game loadout adjustment (changing abilities/ultimate resets cooldown)                                  | **MVP-if-time**                                     | game doc                     |
| Magus Revive default action; class passives                                                                | **MVP** / passives **MVP-if-time**                  | game doc                     |
| Pick up and throw (Levitate, Grab, Pick Up); wall chunks and felled trees as carryables                    | **MVP-if-time**                                     | game doc                     |
| Combos: Slam + Shockwave explosion; Death Ray lock                                                         | **MVP-if-time**                                     | game doc                     |
| Artifacts (Mortar, Soul Orb) in the two gadget slots                                                       | **MVP-if-time**                                     | game doc                     |
| Form change at buildings (Ascendance, Enchantment)                                                         | **post-MVP**                                        | game doc (yellow); brief D12 |
| Class switching mid-match and its ultimate penalty                                                         | **post-MVP**                                        | game doc ("Needs work")      |

### Game modes and online (new requirements, 2026-10-10)

Both requirements were set by the course instructor (DEC-36, DEC-37).

| Item                                                                                                                                                                                                                                                                                                                                                                | Tag                                                                            | Source |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| Duel: a second game mode, 1v1 against another player through a Duel matchmaking queue; both players in the Cathedral with its doors closed and the surrounding world deactivated; first to 10 kills with a match-point system; players reset after each kill while map damage stays; the ultimate's cooldown persists through death, other abilities reset on death | **MVP** (planned now; must be implemented by the end of Sprint 3 (2026-11-13)) | DEC-36 |
| A server that supports hundreds or thousands of concurrent players (solo matches vs bots, Duels, idle players, logins and logouts)                                                                                                                                                                                                                                  | **MVP** (planned now; must be implemented by the end of Sprint 3 (2026-11-13)) | DEC-37 |
| A database of player profiles, game ids and stats; performance-based matchmaking                                                                                                                                                                                                                                                                                    | provisional, open (plan question; DEC-36 says "in the future")                 | DEC-36 |

Open questions for both are consolidated in `../../plan/multiplayer-and-scalability-plan.md`.

### Controls, UI, presentation

| Item                                                                                                                       | Tag          | Source                                 |
| -------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------- |
| Top-down; WASD default movement; 1, 2, 3, 4 for abilities with 4 the ultimate; Z and C for gadgets; click to attack        | **MVP**      | requirements; game doc                 |
| No hard-coded controls; configurable via settings with press-to-bind; mouse side buttons; prompts reflect current bindings | **MVP**      | requirements                           |
| Controller support; first-person full game (third-person option)                                                           | **post-MVP** | requirements; game doc                 |
| Low-poly or pixel art in-game                                                                                              | **MVP**      | game doc                               |
| High-quality character art on the selection screen (the owner's Figma art for now; DEC-51)                                 | **MVP**      | game doc (yellow); DEC-51 (2026-10-28) |
| Simple loading screen                                                                                                      | **MVP**      | requirements                           |
| Simple game boot menu (structure below)                                                                                    | **MVP**      | requirements                           |
| Developer menu, enable/disable in-game (structure below)                                                                   | **MVP**      | requirements                           |
| Anti-air defence                                                                                                           | **post-MVP** | game doc (orange)                      |

### Engineering constraints stated with the MVP

| Item                                                                                                                                           | Tag     | Source                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------- |
| JavaScript, TypeScript, CSS, HTML only; no game engine                                                                                         | **MVP** | requirements (TypeScript everywhere is decided, D1) |
| OOP, SOLID, DRY, patterns; no monoliths, no tight coupling, no hardcoding, no magic numbers                                                    | **MVP** | requirements                                        |
| Change 3 config values (`numLanes`, `spawnTowersPerLane`, `buffTowersPerLane`) and the map adjusts                                             | **MVP** | requirements                                        |
| Adding/changing abilities, weapons and restrictions is trivial in code                                                                         | **MVP** | requirements                                        |
| Runtime monitoring and logging: entity through an unbreakable object or unbroken wall, despawn without a remover, death without a killer, etc. | **MVP** | requirements                                        |
| Tests that "actually connect"; agentic harness with `CLAUDE.md`/`AGENTS.md`-style files for every agent                                        | **MVP** | requirements                                        |

## Game doc "MVP decisions so far" (all adopted)

- All non-player characters are bots, including the enemy Rover. **MVP**
- WASD and numbers for abilities; controller and first-person come later. **MVP** / **post-MVP**
- Low-poly or pixel art in-game, with high-quality character art on the selection screen.
  **MVP**; selection-screen art **MVP** since 2026-10-28 (DEC-51: the owner's Figma art for now;
  yellow in the game doc)
- Ability upgrades on hold beyond basic level scaling. **MVP** decision (yellow: the hold itself
  is the thing needing planning)

Team next steps recorded in the game doc: integrate the team meeting's decisions into the
document (done by this reference set), and schedule a full team meeting to walk through it
before coding begins.

## Long-term goals (post-MVP)

From the requirements doc's "Long term goal" and the game doc, all **post-MVP**:

- First-person view with a third-person option in settings; view switching bindable to hotkeys.
- Console controller key configs.
- Full ability levelling (ability upgrade tree still undecided).
- Game engine use (Unity, Unreal Engine, etc.) for development, with a language change: the
  logic and structure must translate to a new surface rather than restart from zero.
- The flying class (shown locked; display name decided, DEC-48, in `content/legends/locked/`),
  mounts, form changes.
- Anti-air defence; multiple maps; unique skins per team; the armour-set slot.
- "Everything in the reference document + much more."

The product owner's framing for why the MVP is over-engineered on purpose: "new idea? add a new
class!" so that these early stages are like building a custom Lego set. The extension points
are catalogued in `../../architecture/17-extension-recipes.md` and the backlog in
`../../plan/backlog-post-mvp.md`.

## Boot-menu structure (MVP)

From the requirements doc ("simple game boot menu with options for"), mapped to the planned
screens in `apps/client/src/ui/screens/`:

```text
Boot (BootScreen: load manifest, open persistence)
└─ Main menu (MainMenuScreen)
   ├─ Start match          → simple loading screen → match (MatchScreen) → results (ResultsScreen)
   ├─ Loadouts             (LoadoutScreen) configure loadouts, saved to the profile
   ├─ Profile              (ProfileScreen; "better, themed name needed")
   │    └─ Match history: match id, character scores, achievements/medals
   │       (achievements do not exist yet; must be an easy add — an achievements hook)
   ├─ Settings             (SettingsScreen) key bindings with press-to-bind, presets, reset
   └─ About / credits      (AboutScreen)
```

Developer menu (in-match, can be enabled/disabled; `DeveloperMenu` in `ui/hud/`):

- Add/remove Legends (max 10 per team).
- Spawn mobs from different origin points (max 144 units per team; must not crash).
- Sim mode: remove/add the user-controlled Legend so the match runs bots-only.
- `Recommendation:` also expose the invariant level (off/light/heavy), the perf overlay and a
  seed/replay control, since the requirements doc wants constant monitoring while the game runs.

All of the above is **MVP**.

## Engineering notes

- Scope is enforced by traceability, not memory: every **MVP** line here has, or gets, an FR-/NFR-
  id in `../../requirements/06-mvp-requirements.md`, and every phase in `../../plan/` lists the
  ids it delivers. An **MVP-if-time** line has an id flagged as a cut line. A **post-MVP** line
  appears only in `../../plan/backlog-post-mvp.md` and in the extension recipes.
- If you find a feature in a game-design doc that is not in this list, it is not in scope until
  it is added here and in the catalogue.

## Related

- [MVP requirements catalogue](../../requirements/06-mvp-requirements.md)
- [Plan](../../plan/README.md)
- [Post-MVP backlog](../../plan/backlog-post-mvp.md)
- [Overview and status legend](00-overview-and-status-legend.md)
- [Open questions](12-open-questions.md)
- [Architecture: extension recipes](../../architecture/17-extension-recipes.md)
- [Verbatim requirements doc](../../requirements/source/requirements-of-architecture.md)
- [Verbatim game doc](../source/game-project-eternalus-v2.md)

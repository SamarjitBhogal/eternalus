---
title: Objectives, capture points and bosses
description: How a match is scored and won, the capture points and their three checkpoints, the central capture zones, the mini-bosses, the central Eternal boss, the corner camps and the boss-spawn buffs; read it before working on the MatchDirector, CaptureSystem or boss AI.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-10
tags: [reference, game-design, objectives, capture-points, bosses, match-timeline]
paths: ['packages/core/src/match/**']
related:
  - 'docs/reference/game-design/02-entities-and-units.md'
  - 'docs/reference/game-design/05-map.md'
  - 'docs/architecture/12-game-story-and-match-director.md'
---

# Objectives, capture points and bosses

**Purpose.** Read this when you work on the match itself rather than the units in it: scoring,
the win condition, the capture points and what holding them gives, the timed events (mini-bosses
at the quarter mark, the gem exploding mid-match) and the neutral bosses that gate them. It is
the source for the `MatchTimeline` content and the `MatchDirector` phases.

## Objectives and scoring

From the game doc (all **MVP** unless marked):

- Each team has buildings; buildings are objectives to destroy or capture.
- Points of interest are areas of mutual capture. At the start of the game, no one owns them.
- Teams gain points by capturing and holding points of interest, destroying or capturing enemy
  buildings, and getting kills.
- **Destroying the enemy capital (Stronghold) wins the game.**
- Capture points have three checkpoints (below).

Points are a score, not a currency: there is no item shop (`06-abilities-and-progression.md`).
The requirements doc asks for "character scores" in the match history, so the score per Legend
and per team is part of the `MatchResult`. Point values per event are `TUNE` and unset in the
sources (`Recommendation:` start with kill 1, structure 5, capture 3 per checkpoint, hold 1 per
minute, and let balancing move them; see `../suggestions/balancing.md`).

"Capturing" an enemy building is listed as an objective in the first bullet but no capture
mechanic for buildings is described anywhere in the sources; only capture points are captured.
It is an open question (`12-open-questions.md`).

## Capture points and their three checkpoints

Status: **MVP** (requirements doc: "3 central capture points (1 per lane, reference the document
on what they entail)").

A capture point is a zone. Capturing it progresses through three checkpoints; each checkpoint
spawns neutral **assist mobs** that must be beaten, and winning it grants XP:

| Checkpoint | Spawns                                                  | Effect when destroyed / won                                                                           | Status                                                     |
| ---------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1          | Multiple medium assist mobs                             | Small individual XP, shared among nearby allies with a bias toward the ally who did the most damage   | **MVP**                                                    |
| 2          | Multiple heavy assist mobs, plus some light assist mobs | Medium individual XP, shared among nearby allies with a bias toward the ally who did the most damage  | **MVP**                                                    |
| 3          | One massive assist mob (Balrog-type)                    | Greater individual XP, shared among nearby allies with a bias toward the ally who did the most damage | **MVP-if-time** (the Balrog-type mob is a boss-grade unit) |

XP sharing rule (all three rows): individual XP to the capturer, shared among nearby allies with
a bias toward the ally who did the most damage. "Nearby" is a radius in content; "bias" is a
weight in content. Assist mob counts are `TUNE`.

How the checkpoints relate to a single point is not spelled out in the source. Two readings fit
the text: (a) three stages of capturing the same zone, each stage spawning its wave; (b) three
zones in sequence along a lane. `Recommendation:` implement (a), since the requirements doc
counts exactly 3 central capture points (one per lane) and the game doc places the mini-boss on
"its capture point"; the `CapturePoint` entity carries `checkpoint: 1 | 2 | 3` and `progress`.
Recorded as an open question.

## Central capture zones

Status: **MVP**.

- Three central capture zones, one per lane. The middle lane's zone is the **Cathedral**, the
  major capture point; the outer lanes hold lesser capture points (`05-map.md`).
- **Holding a zone reduces ability cooldowns and boosts friendlies.**
- **Holding a middle zone long enough levels up friendly minions on that side and reduces
  ability and ultimate cooldowns. The buff is lost if the zone is lost.** ("Long enough" is a
  hold duration `TUNE`.)
- At the start of the game no one owns them.
- Up until the mini-bosses spawn, the capture zones are protected by: _(the source leaves this
  bullet empty; open question)_.

Whether "a middle zone" means only the Cathedral or any of the three central zones is ambiguous
in the source; `Recommendation:` all three central zones give the cooldown reduction, and the
Cathedral additionally levels up minions. Recorded as an open question.

## Mini-bosses at the quarter mark

Status: **MVP** (the requirements doc names mini-bosses among the neutral units).

- **At the quarter mark of the game** (a `MatchTimeline` event, `TUNE` relative to the match
  length), the top and bottom lanes each spawn a **mini-boss** along with high-power enemy and
  support mobs.
- They fight anyone inside their zone, from either team, and **stay restricted to their capture
  point** (zone-locked; `BossController` never leaves the zone).
- **While the mini-boss is alive, its zone cannot be captured.**
- It takes multiple players to defeat. **On defeat, the team gets a permanent buff and a large
  amount of ability XP to spend on abilities.** In the MVP there is no ability tree to spend it
  on (`06-abilities-and-progression.md`); the XP goes to level scaling until the tree exists.
- **The player who lands the final hit gets a consumable item** — keep or remove? Open question
  (consumables do not otherwise exist in the design).
- Each mini-boss is a minor-to-medium Souls-like boss: hard, with multiple moves, never standing
  still, fighting any player or team-associated mob, with high damage and high health. Still
  nothing compared to the middle boss.

"The team" that gets the buff is the team that lands the kill; a permanent team buff is a
`StatusEffect` with no expiry on the `Team`, applied to present and future units.

## The central boss: Eternal (rename pending)

Status: **MVP-if-time** (see `02-entities-and-units.md`). Decided at the team meeting: the gem
spawns in the centre Cathedral and **explodes mid-game** (a `MatchTimeline` event, `TUNE`) to
summon the boss. **The boss belongs to no team** (`team = 'neutral'`).

- Obscenely massive: a Souls-like boss built for a multi-player or multi-team coordinated attack.
  Far more brutal than the lane mini-bosses.
- When summoned, **a map-wide atmosphere change spreads outward from the Cathedral**. The boss
  explodes from the crystal, erupts through the roof, and roars. (The source still uses the
  removed name "Titan" in this sentence.)
- **The whole team gets XP on the boss kill.**
- **The player who lands the final hit becomes an Eternal**: their class is upgraded with new
  abilities and animations (the source says "Mage Prime, Tank Prime, Assassin Prime, etc.";
  the Form change table says "Warrior′, Sentinel′, Magus′") as they grow in size and stature.
- **An Eternal player has a massively increased health bar, greatly increased damage output,
  and knockback/stun reduction; they die once their health bar is depleted** (no revive back to
  Eternal).
- Earlier idea, still listed as open in the boss section: the gem glows brighter the closer the
  game is to summoning it. The open-question entry "Gem glow: tied to a team's summoning
  progress or to the mid-game timer?" is **removed** (red). Since the summon is now on the
  mid-game timer, the glow, if kept, is a pure presentation effect of the timer.
- "Central boss as its own game mode?" — **removed** (red).

The Eternal form is the only row of the Form change table that is not yellow: it stays in the
design as the central-boss reward, while Ascendance/Enchantment at buildings are post-MVP. In
the model it is a `StatusEffect` (or specialization) applied to the Legend that swaps its ability
set from content; it does not need a new class.

## Corner camps

Status: **MVP-if-time** (game doc "included in MVP if possible"; brief: post-MVP unless time
allows).

- Outer camps are fortified neutral camps: buildings surrounded by impassable rifts ("the
  purple" on the map draft). Each is unique in design.
- Each holds **high-level mini-bosses from the start of the game**.
- **Killing a boss and its supporting minions gives your team XP and spawns a wave of heavy
  minions from your Stronghold.** The wave goes down **the lane where you are worst off**
  (lowest structure damage dealt, most structures lost, pushed furthest back, etc.). The "worst
  lane" choice is a scoring function in content (`Recommendation:` weighted sum of structures
  lost, front-line distance and recent damage; a `LaneAssessment` query on `GameState`).
- **A crystal within each camp cannot be broken. It spawns new bosses every 5 minutes `TUNE`
  after a mini-boss's death.**

DEC-12 (2026-10-10) changes the first half of that bullet once the centre boss spawns: see
"Volatile crystals" below.

Corner camps are the only place mini-bosses exist before the quarter mark, which is why the lane
mini-bosses are described as "nothing compared to the middle boss" but the corner ones as
"high-level".

## Minion buffs on boss spawn

Status: **MVP-if-time**. "An idea going with the theme of buffs and debuffs being a big thing":

- When the middle boss spawns, **all neutral camps become stronger and more aggressive**.
- **The corner camps begin spawning waves of light/medium enemies that attack your lanes from
  the sides.**
- **A heavy mini-boss guards the crystal that spawns new waves every 4 minutes `TUNE`.**

The 5-minute boss respawn and the 4-minute wave cadence are two different timers on the same
crystal in the source; both are `TUNE` and both are `Spawner` component values on the `Camp`. The
owner accepted both as starting values (DEC-12, 2026-10-10).

**Volatile crystals (DEC-12; MVP-if-time with the corner camps).** Once the centre boss spawns,
the corner camps' crystals become **volatile**: they are breakable, and when one is destroyed it
releases a shockwave that destroys its camp, deals massive area damage and applies a temporary
**`insanity`** debuff. What `insanity` does is TBD (owner); until then it is a description and an
icon with no effect applied. The shockwave's radius and damage and the debuff's duration are TBD
(owner). **Open (owner):** whether "the centre boss spawns" means the moment the boss is summoned
or the mid-game mark, and whether crystals turn volatile at all if the GreaterBoss is cut; how
much health a volatile crystal has and who can break it (either team? damage only?); whom the
shockwave hits; whether a destroyed camp stays gone for the rest of the match.

## Win condition and match end

- The match ends when a Stronghold is destroyed; the other team wins. `MatchDirector` moves
  to the `results` phase and produces a `MatchResult` (winner, score per team and per Legend,
  kills/assists, structures destroyed, captures) that the profile's match history stores
  (`11-mvp-scope.md`).
- There is no time limit (the sources give none, and DEC-13 keeps none). The timeline events are
  relative to a configured nominal match length, so "quarter mark" and "mid-game" are concrete
  ticks even without a limit. The owner set the planned match to **30 minutes** (DEC-13,
  2026-10-10); the value lives in `GameConfig`'s `plannedMatchSeconds`, and the marks scale with
  it. **To confirm (owner):** the optional score cap; scaled with the match, as the answer
  reads, it is 4050 s.

## Match timeline (MVP summary)

All values `TUNE`; sources in brackets. The quarter mark and mid-game are fractions of the
planned match length (30 minutes, DEC-13).

| When                            | Event                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| t = 0                           | 1-minute countdown; 3 hordes of 16 light minions spawn from each Stronghold, one per lane [requirements]            |
| t = 60 s                        | Towers begin spawning hordes every 60 s [requirements]                                                              |
| after camp cooldown             | Forest camps spawn their units [requirements]                                                                       |
| quarter mark                    | Mini-bosses plus support mobs on the top and bottom lane capture zones [game doc]                                   |
| mid-game                        | Cathedral gem explodes; Eternal boss summoned; atmosphere change; camps buffed; corner waves every 4 min [game doc] |
| boss spawns (trigger open)      | Corner crystals turn volatile [DEC-12]                                                                              |
| every 5 min after a corner kill | Corner crystal respawns its mini-boss [game doc]                                                                    |
| Stronghold destroyed            | Match ends [game doc]                                                                                               |

## Engineering notes

- `MatchDirector` is a State pattern over `MatchPhase` (`countdown → open → quarter → midgame →
… → results`) driven by `MatchTimeline` content, not by hard-coded tick numbers. Adding a timed
  event is one timeline entry plus one handler class registered by event type.
- `CaptureSystem` owns zone ownership and checkpoint progress and emits `capture-progressed`,
  `capture-won`; the cooldown reduction and minion level-up are `StatusEffect`s applied by
  handlers of those events, so the reward for holding a zone is content.
- Bosses are `Boss` units with a `BossController` FSM over moves defined in content; zone lock is
  a `MovementStrategy` bound to the zone. Rewards (permanent team buff, XP, Eternal form) are
  handlers of `entity-died` with a `RemovalCause` that names the killer.
- Invariants: a zone with a living mini-boss never changes owner; the Eternal boss has
  `team = 'neutral'`; every reward event references a living Legend or a team.

## Related

- [Entities and units](02-entities-and-units.md)
- [Structures and defences](03-structures-and-defenses.md)
- [Map](05-map.md)
- [Abilities and progression](06-abilities-and-progression.md)
- [MVP scope](11-mvp-scope.md)
- [Open questions](12-open-questions.md)
- [Architecture: game story and match director](../../architecture/12-game-story-and-match-director.md)
- [Architecture: game AI](../../architecture/11-game-ai.md)
- [Suggestions: balancing](../suggestions/balancing.md)
- [Verbatim source](../source/game-project-eternalus-v2.md)

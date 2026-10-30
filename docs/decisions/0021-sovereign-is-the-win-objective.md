---
title: 0021. The sovereign is the win objective
description: Record of the owner's 2026-10-28 rulings that replace "Stronghold destroyed wins" (FR-002, FR-021) - a team loses when its sovereign (the King, displayed "Emperor") dies; one generic ObjectiveLostCondition with a WinObjective component; no time limit; a new entity family `sovereign` under Unit, amending ADR 0006 decision 1; read this before building victory conditions, the sovereign or anything that treats the Stronghold as an objective.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-29
tags: [adr, victory, match-director, entities, requirements]
related:
  - 'docs/plan/game-loop-and-results-plan.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'docs/architecture/12-game-story-and-match-director.md'
  - 'docs/architecture/07-structures-obstacles-and-destructibles.md'
  - 'docs/architecture/04-entity-architecture.md'
  - 'docs/decisions/0006-entity-model-inheritance-plus-composition.md'
  - 'docs/requirements/06-mvp-requirements.md'
---

# 0021. The sovereign is the win objective

- Status: accepted (the product owner gave the rulings in chat on 2026-10-28, DEC-71 to DEC-74 and
  DEC-81, and accepted this ADR, its code names and the plan §6 edits on 2026-10-29: "all
  accepted", DEC-83. The code names in decisions 2 and 4 were the agent's pick under his request
  for generic names.)
- Date: 2026-10-28

## Context

FR-002 and FR-021 say a team wins when the enemy Stronghold is destroyed. Architecture 12 §6 builds
that as `StrongholdDestroyedCondition` (MVP), with `ScoreCapCondition` after `maxMatchSeconds`
(MVP-if-time). On 2026-10-27 the owner named the King kill as the final win condition. On
2026-10-28 he answered the game-loop plan's questions (plan §5c):

- "The king is the only win. The stronghold is now a structure that holds the king and is mostly
  just a container for him, his throne room, and acts as the spawn point for the Citadel host
  units. … stronghold is a container structure, no longer a win condition or listed objective."
- The King is a "Team-owned unit that fights", "Stays in the throne room", and is "Protected by a
  Host of Heavy, Medium, and Light units".
- "Anything function that requires it should be given a different naming structure (e.g.,
  KingSlainCondition …) … something even more generic that can apply to different game modes with
  different win condition objectives".
- "same no-max as Smite 2 and League of Legends": a match has no time limit.

ADR 0006 decision 1 fixes the entity families. A unit that is not a Legend, a Mob or a Boss has no
family.

## Decision

1. **A team loses when its sovereign dies.** The sovereign (owner word: King; display name per team
   in content, "Emperor" by default) is the only MVP win objective. The Stronghold (code name
   `Citadel` after plan task GL-14) holds the sovereign and its throne room and spawns its Host. It
   is not a victory condition or a listed objective.
2. **One generic rule.** `ObjectiveLostCondition` (id `objective-lost`) fires when a team's last
   live entity with a `WinObjective` component dies. The other team wins. If both teams lose their
   last objective on one tick, the match is a draw (DEC-77). The condition names no kind. Content
   puts `WinObjective` on whatever a mode protects: the sovereign here, and a structure or payload
   in another mode.
3. **No time limit.** `VictoryConditionId` is `'objective-lost' | 'forfeit' | 'aborted'`.
   `StrongholdDestroyedCondition` and `ScoreCapCondition` leave the design. `plannedMatchSeconds`
   (1800) only places the timeline marks; it ends nothing.
4. **A new entity family, `sovereign`.** An abstract `Sovereign` class at depth 2 under `Unit`, and
   a concrete leaf `Monarch` (content id `monarch`) at depth 3. This amends ADR 0006 decision 1's
   family list, and nothing else in it. The sovereign is not a `Boss`: bosses are neutral (04 §8,
   `BossIsNeutralInvariant`), target anyone (11) and pay boss rewards (12 §7). It is not a
   `Structure`, because it fights.
5. **Its rules are content, controller and one damage step, not condition logic** (DEC-72 to
   DEC-74). It takes no damage while any BuffTower of its team lives: a `DamageStep` (05 §9) that
   returns 0 for a protected target. Every attacker deals full damage. It cleaves,
   stays in the throne-room zone (middle-back in the Citadel), attacks neutrals that enter, and uses
   a long-range attack on attackers who stay out of its reach. After 90 s out of combat it
   regenerates slowly. Stats and rates are `TUNE`, starting from the mini-boss anchor. It never
   respawns, because its death ends the match.

## Consequences

- Requirements change when this ADR is accepted (NFR-010). FR-002 and FR-021 change from
  "Stronghold destroyed" to "sovereign slain". FR-022 and FR-029 add that BuffTowers make their
  sovereign immune.
- The architecture edits are listed in `docs/plan/game-loop-and-results-plan.md` §6: 12 Purpose,
  §1, §6, §12; 07 §1, §8; 04 §1, §2; 05 §9; 11 §4. The owner accepted them on 2026-10-29 (DEC-83). Each one
  lands with the plan task that builds it, and every edit is reported to him. ADR 0006 gets only
  an "amended by 0021" note on its Status line.
- Until structure entities exist, no BuffTower lives, so the sovereign can always be hurt and a
  match can be won with no stand-in. The owner said "fine as long as a dev handles this before the
  27th" of the plan's earlier "no human can win in the browser"; the plan reads that as covering
  this gap too, so the immunity must exist before the 2026-11-27 presentation. Gurshaan's
  structures close it.
- A Duel mode (ADR 0016) passes its own condition list, as before.

## Alternatives considered

- `KingSlainCondition` with a `king` family: the owner asked for generic names.
- Keep `StrongholdDestroyedCondition` as a fallback until the sovereign is tested (the plan's first
  recommendation): the owner ruled the sovereign is the only win.
- The sovereign as a `Structure` kind that `structure-destroyed` ends: the owner ruled it fights.

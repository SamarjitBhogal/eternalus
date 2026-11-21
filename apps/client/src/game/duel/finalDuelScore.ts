import { opponentOf, type PlayableTeam, type Snapshot } from '@eternalus/core';

import type { DuelHudState } from '../../bridge/hud.types';

/**
 * The Duel's score as it stood in `snapshot` (the last `state` the server sent before
 * `match-ended`, which carries the winning kill), from `team`'s side; no countdown. `null` when
 * the snapshot has no Duel score. The HUD publishes the score on its throttled cadence, so the
 * results read this one instead of the HUD's last (SCRUM-449).
 */
export function finalDuelScore(snapshot: Snapshot, team: PlayableTeam): DuelHudState | null {
  const { duel } = snapshot.match;
  if (duel === undefined) return null;
  return {
    ownKills: duel.kills[team],
    opponentKills: duel.kills[opponentOf(team)],
    killTarget: duel.killTarget,
    countdown: null,
  };
}

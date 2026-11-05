/**
 * Test support: the `Simulation` options that make `player` the match's human, as the session
 * builds them (`withPlayerTeam`, `rosterSlots`). Imported only by tests.
 */
import type { GameConfig, PlayableTeam, RosterSlot } from '@eternalus/core';

import type { LegendClassId } from '../../bridge/domain.types';
import { withPlayerTeam } from '../withPlayerTeam';

/**
 * Which Legend the player plays and on which team: the selection's class and the setup's team
 * (HC-F4). The Legend (sub-class) pick is setup data only and never reaches the match (DEC-49).
 */
export type PlayerChoice = {
  /** The class id, which is also the Legend's definition id in core content (`'magus'`). */
  readonly legend: LegendClassId;
  readonly team: PlayableTeam;
};

/**
 * `config` played for `player`'s team and a roster of `player`'s human slot (their team's Rover,
 * DISC-51) followed by `bots`.
 */
export function withPlayer(
  config: GameConfig,
  player: PlayerChoice,
  bots: readonly RosterSlot[] = [],
): { readonly config: GameConfig; readonly roster: readonly RosterSlot[] } {
  return {
    config: withPlayerTeam(config, player.team),
    roster: [
      { pilot: 'human', team: player.team, definitionId: player.legend, role: 'rover' },
      ...bots,
    ],
  };
}

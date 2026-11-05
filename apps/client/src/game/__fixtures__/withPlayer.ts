/**
 * Test support: the `Simulation` options that make `player` the match's human, as the session
 * builds them (`withPlayerTeam`, `rosterSlots`). Imported only by tests.
 */
import type { GameConfig, RosterSlot } from '@eternalus/core';

import type { PlayerChoice } from '../Match.types';
import { withPlayerTeam } from '../withPlayerTeam';

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

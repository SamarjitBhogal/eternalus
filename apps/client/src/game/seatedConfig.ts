import type { GameConfig } from '@eternalus/core';

import type { PlayerChoice } from './Match.types';

/**
 * `config` with the human's seat filled in: the player's team and Legend, which core spawns at the
 * team's Stronghold when the match is built (plan A19). Returns a new config; `config` is frozen.
 */
export function seatedConfig(config: GameConfig, player: PlayerChoice): GameConfig {
  return {
    ...config,
    match: { ...config.match, playerTeam: player.team, seat: { definitionId: player.legend } },
  };
}

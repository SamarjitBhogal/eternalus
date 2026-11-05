import type { GameConfig } from '@eternalus/core';

import type { PlayerChoice } from './Match.types';

/**
 * `config` played for the player's team (`match.playerTeam`). The player's Legend is the roster's
 * human slot (`rosterSlots`), which core spawns on that team. Returns a new config; `config` is
 * frozen.
 */
export function seatedConfig(config: GameConfig, player: Pick<PlayerChoice, 'team'>): GameConfig {
  return { ...config, match: { ...config.match, playerTeam: player.team } };
}

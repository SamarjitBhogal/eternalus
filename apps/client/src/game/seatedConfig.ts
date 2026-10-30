import type { GameConfig, MapDefinition, Vec2 } from '@eternalus/core';

import type { PlayerChoice } from './Match.types';

/**
 * Where the player's team starts: the position of its stronghold on `map`.
 *
 * @throws Error when the map has no stronghold for `team`.
 */
export function strongholdOf(map: MapDefinition, team: PlayerChoice['team']): Vec2 {
  const stronghold = map.features.find(
    (feature) => feature.kind === 'stronghold' && feature.team === team,
  );
  if (stronghold === undefined) {
    throw new Error(`Map "${map.id}" has no ${team} stronghold to spawn the player at.`);
  }
  return stronghold.position;
}

/**
 * `config` with the human's seat filled in: the player's team and Legend, spawned by core at the
 * team's stronghold when the match is built (plan A19). Returns a new config; `config` is frozen.
 *
 * @throws Error when the map has no stronghold for the player's team.
 */
export function seatedConfig(
  config: GameConfig,
  map: MapDefinition,
  player: PlayerChoice,
): GameConfig {
  const at = strongholdOf(map, player.team);
  return {
    ...config,
    match: { ...config.match, playerTeam: player.team, seat: { definitionId: player.legend, at } },
  };
}

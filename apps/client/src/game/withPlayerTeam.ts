import type { GameConfig, PlayableTeam } from '@eternalus/core';

/**
 * `config` played for `team` (`match.playerTeam`, from the setup). The player's Legend is the
 * roster's human slot (`rosterSlots`), which core spawns on that team. Returns a new config;
 * `config` is frozen.
 */
export function withPlayerTeam(config: GameConfig, team: PlayableTeam): GameConfig {
  return { ...config, match: { ...config.match, playerTeam: team } };
}

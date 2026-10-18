import type { LegendName } from './catalogue.types';
import type { PlayableTeam } from './domain.types';

/**
 * The Legend's name as `team` knows it (OA3: the factions are mirror universes and content stores
 * both names). `null` when the Legend has no name yet or there is no team; the caller then shows only
 * the sub-class title. A display of an enemy Legend passes the enemy team.
 */
export function legendNameFor(name: LegendName | null, team: PlayableTeam | null): string | null {
  if (name === null || team === null) return null;
  return name[team];
}

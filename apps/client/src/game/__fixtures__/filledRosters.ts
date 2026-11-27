/**
 * Test support: the rosters LOCK IN fills, built from the sub-class (spec) ids a test is about.
 * Every other field has a neutral value. Imported only by tests.
 */
import type { FilledRosters, RosterEntry } from '../../bridge/events';

/** One roster entry of `team` with the sub-class `specId`; the class does not matter here. */
function entry(
  team: RosterEntry['team'],
  index: number,
  specId: string | null,
  isPlayer: boolean,
): RosterEntry {
  return {
    legendId: `${team}-${String(index + 1)}`,
    displayName: `Legend ${String(index + 1)}`,
    classId: 'warrior',
    specId,
    isBot: !isPlayer,
    isPlayer,
    isRover: index === 0,
    team,
  };
}

/**
 * Light rosters with the player (`player`, the light Rover) first, then the light bots (`allies`),
 * and dark rosters of the bots `enemies`, each by its sub-class id (`null`: none).
 */
export function filledRostersFixture(picks: {
  readonly player: string | null;
  readonly allies?: readonly (string | null)[];
  readonly enemies?: readonly (string | null)[];
}): FilledRosters {
  const { player, allies = [], enemies = [] } = picks;
  return {
    allies: [player, ...allies].map((specId, index) => entry('light', index, specId, index === 0)),
    enemies: enemies.map((specId, index) => entry('dark', index, specId, false)),
  };
}

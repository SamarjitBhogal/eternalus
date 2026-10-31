import type { EnemyRoverRule, SeededRandom } from '@eternalus/core';

import type { LegendClassCard } from '../../bridge/catalogue.types';
import type { ClassSelection, FilledRosters, RosterEntry } from '../../bridge/events';
import { isSelectableSpec } from '../../bridge/selectionRules';
import { botDisplayName } from './buildMatchSetup';

/** What each enemy-Rover rule makes of the player's pick (a new rule is one entry). */
const ENEMY_ROVER_RULES: Readonly<
  Record<EnemyRoverRule, (pick: ClassSelection) => ClassSelection>
> = {
  // DEC-61: the enemy Rover copies the player's class and Legend (the Legend copy is DEC-61's
  // `Recommendation:`).
  'mirror-player': (pick) => pick,
};

/**
 * Fills the draft's rosters at LOCK IN (DEC-61; DEC-102: no match starts without LOCK IN, so this
 * is the only fill). The player takes the pick; the enemy Rover takes what `enemyRover` makes of
 * it; every other bot keeps its class and draws a selectable Legend of it from `rng`, allies first,
 * in roster order, `null` for a class with none. Draws are independent, so two bots may share a
 * Legend (DEC-102). The same draft, pick and stream give the same rosters.
 * @param inputs.rng - The match seed's own roster stream (`SeededRandom.fork`), never the team
 *   draw's stream.
 * @throws Error when the pick or a bot names a class the catalogue does not have.
 */
export function fillRosters(inputs: {
  readonly draft: FilledRosters;
  readonly selection: ClassSelection;
  readonly legendClasses: readonly LegendClassCard[];
  readonly enemyRover: EnemyRoverRule;
  readonly rng: Pick<SeededRandom, 'nextInt'>;
}): FilledRosters {
  const { draft, selection, legendClasses, enemyRover, rng } = inputs;
  const cardOf = (classId: string): LegendClassCard => {
    const card = legendClasses.find((candidate) => candidate.classId === classId);
    if (card === undefined) throw new Error(`fillRosters: no class "${classId}" in the catalogue`);
    return card;
  };
  const roverPick = ENEMY_ROVER_RULES[enemyRover](selection);
  const fill = (entry: RosterEntry, index: number): RosterEntry => {
    if (entry.isPlayer) return { ...entry, ...selection };
    if (entry.isRover) {
      return {
        ...entry,
        ...roverPick,
        displayName: botDisplayName(cardOf(roverPick.classId), index),
      };
    }
    const legends = cardOf(entry.classId).specs.filter(isSelectableSpec);
    const legend = legends.length === 0 ? undefined : legends[rng.nextInt(0, legends.length - 1)];
    return { ...entry, specId: legend?.specId ?? null };
  };
  const allies = draft.allies.map(fill);
  return { allies, enemies: draft.enemies.map(fill) };
}

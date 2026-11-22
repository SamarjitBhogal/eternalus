import type { AggroPriority, UnitClass } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { AggroRankOptions } from './aggroRank.types';

/** What each priority entry matches: an enemy of `attacker` class, attacking an ally of `victim`. */
const MEANING: Readonly<
  Record<AggroPriority, { readonly attacker: UnitClass; readonly victim: UnitClass | null } | null>
> = {
  'legend-attacking-ally-legend': { attacker: 'legend', victim: 'legend' },
  'minion-attacking-ally-legend': { attacker: 'minion', victim: 'legend' },
  'minion-attacking-ally-minion': { attacker: 'minion', victim: 'minion' },
  'turret-attacking-ally-minion': { attacker: 'turret', victim: 'minion' },
  'closest-minion': { attacker: 'minion', victim: null },
  'closest-legend': { attacker: 'legend', victim: null },
  // Matched by id instead: the candidate is the horde's next objective (18 §6.2).
  'lane-objective': null,
};

/**
 * The index of the first entry of `priority` that the enemy `candidate` matches, as seen by a unit
 * of `options.team` (architecture 11 §4.3, 18 §6.1); lower is better, `-1` when none matches. An
 * enemy attacks its lock and each other body its last attack hit (`EntityStore.victimsOf`,
 * DEC-322 (2)), so a player who aims, with no lock, ranks by what it hit; with several allies
 * attacked, the best entry they match counts. Pure: the ranking helper minion and guard
 * controllers share (MS-27).
 */
export const aggroRank = (
  candidate: EntityId,
  { team, priority, entities, classOf, tick, objectiveId = null }: AggroRankOptions,
): number => {
  if (candidate === objectiveId) {
    return priority.indexOf('lane-objective');
  }
  const kind = entities.get(candidate)?.kind;
  const attacker = kind === undefined ? null : classOf(kind);
  const victims = entities.victimsOf(candidate, tick).flatMap((victimId) => {
    const victimKind = entities.get(victimId)?.kind;
    return victimKind !== undefined && entities.teamOf(victimId) === team
      ? [classOf(victimKind)]
      : [];
  });
  return priority.findIndex((entry) => {
    const meaning = MEANING[entry];
    return (
      meaning !== null &&
      meaning.attacker === attacker &&
      (meaning.victim === null || victims.includes(meaning.victim))
    );
  });
};

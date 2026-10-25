import type { AggroPriority } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { EntityStore } from '../state/EntityStore';
import type { Team } from '../teams/teams.types';

/** The classes the aggro priority list names (architecture 11 §4.3). */
type UnitClass = 'legend' | 'minion' | 'turret';

/** The class of an entity kind, or `null` for a kind the priority list never names. */
export type UnitClassifier = (kind: string) => UnitClass | null;

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
  // ponytail: structures are not entities yet; the lane objective joins in minion plan M2c.
  'lane-objective': null,
};

/**
 * The index of the first entry of `priority` that the enemy `candidate` matches, as seen by a unit
 * of `team` (architecture 11 §4.3, 18 §6.1); lower is better, `-1` when none matches. Pure: the
 * ranking helper minion and guard controllers share (MS-27).
 */
export const aggroRank = (
  candidate: EntityId,
  team: Team,
  priority: readonly AggroPriority[],
  entities: EntityStore,
  classOf: UnitClassifier,
): number => {
  const kind = entities.get(candidate)?.kind;
  const attacker = kind === undefined ? null : classOf(kind);
  const victimId = entities.attackTargetOf(candidate);
  const victimKind = victimId === null ? undefined : entities.get(victimId)?.kind;
  const victim =
    victimId !== null && victimKind !== undefined && entities.teamOf(victimId) === team
      ? classOf(victimKind)
      : null;
  return priority.findIndex((entry) => {
    const meaning = MEANING[entry];
    return (
      meaning !== null &&
      meaning.attacker === attacker &&
      (meaning.victim === null || meaning.victim === victim)
    );
  });
};

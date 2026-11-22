import type { TurretTargetPriority } from '../content/structures/turrets.types';
import type { EntityId } from '../state/EntityStore.types';
import { compareById } from '../utils/compareById';
import type { TurretCandidate, TurretTargetInput } from './turretTarget.types';

/** Which candidates each priority entry names: one rule per entry, no branch on the entry. */
const MATCHES: Readonly<
  Record<
    TurretTargetPriority,
    (candidate: TurretCandidate, heavyKinds: readonly string[]) => boolean
  >
> = {
  'legend-hurting-ally-legend': ({ hasHurtAllyLegend }) => hasHurtAllyLegend,
  'heavy-unit': ({ kind }, heavyKinds) => heavyKinds.includes(kind),
  'nearest-enemy': () => true,
};

/** Whether `a` is nearer than `b`, ties to the lower id. */
const isNearer = (a: TurretCandidate, b: TurretCandidate): boolean =>
  a.distanceSquared < b.distanceSquared ||
  (a.distanceSquared === b.distanceSquared && compareById(a.id, b.id) < 0);

/** The nearest of `candidates` that `entry` names, ties to the lower id, or `undefined`. */
const nearestNamed = (
  entry: TurretTargetPriority,
  candidates: readonly TurretCandidate[],
  heavyKinds: readonly string[],
): TurretCandidate | undefined => {
  let best: TurretCandidate | undefined;
  for (const candidate of candidates) {
    if (
      MATCHES[entry](candidate, heavyKinds) &&
      (best === undefined || isNearer(candidate, best))
    ) {
      best = candidate;
    }
  }
  return best;
};

/**
 * A turret's target (architecture 11 §4.5): first the override entries, in order (the defend-ally
 * override), even while it holds a target: it keeps a target an entry names, else takes the
 * nearest candidate the entry names. Then it keeps its current target while that is still a
 * candidate (alive and in range). Then it takes the nearest candidate of the first priority entry
 * that names one. Ties go to the lower id, so the choice never depends on the order of
 * `candidates`. `null` when nothing names a candidate. Pure.
 */
export const chooseTurretTarget = ({
  currentId,
  candidates,
  overrides,
  priority,
  heavyKinds,
}: TurretTargetInput): EntityId | null => {
  const current = candidates.find(({ id }) => id === currentId);
  for (const entry of overrides) {
    if (current !== undefined && MATCHES[entry](current, heavyKinds)) {
      return current.id;
    }
    const named = nearestNamed(entry, candidates, heavyKinds);
    if (named !== undefined) {
      return named.id;
    }
  }
  if (current !== undefined) {
    return current.id;
  }
  for (const entry of priority) {
    const named = nearestNamed(entry, candidates, heavyKinds);
    if (named !== undefined) {
      return named.id;
    }
  }
  return null;
};

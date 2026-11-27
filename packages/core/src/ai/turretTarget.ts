import type { TurretTargetPriority } from '../content/ai/turret.types';
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

/** Nearer first, ties to the lower id: a sort order that never depends on the input order. */
const byNearness = (a: TurretCandidate, b: TurretCandidate): number =>
  a.distanceSquared - b.distanceSquared || compareById(a.id, b.id);

/**
 * A turret's targets in rank order (architecture 11 §4.5): first, for each override entry in
 * order (the defend-ally override), its current target when the entry names it, then the other
 * candidates the entry names, nearest first; even while it holds a target. Then its current target
 * while that is still a candidate (alive and in range). Then, for each priority entry in order, the
 * candidates it names, nearest first. Each candidate appears once, at its first place; one no
 * entry names is left out. Ties go to the lower id, so the order never depends on the order of
 * `candidates`. `TurretController` takes the first one it has a line of fire to, so a blocked
 * target falls to the next. Pure.
 */
export const rankTurretTargets = ({
  currentId,
  candidates,
  overrides,
  priority,
  heavyKinds,
}: TurretTargetInput): readonly TurretCandidate[] => {
  const current = candidates.find(({ id }) => id === currentId);
  const nearestFirst = [...candidates].sort(byNearness);
  const ranked: TurretCandidate[] = [];
  const add = (candidate: TurretCandidate): void => {
    if (!ranked.includes(candidate)) ranked.push(candidate);
  };
  const addNamed = (entry: TurretTargetPriority): void => {
    for (const candidate of nearestFirst) {
      if (MATCHES[entry](candidate, heavyKinds)) add(candidate);
    }
  };
  for (const entry of overrides) {
    if (current !== undefined && MATCHES[entry](current, heavyKinds)) add(current);
    addNamed(entry);
  }
  if (current !== undefined) add(current);
  for (const entry of priority) addNamed(entry);
  return ranked;
};

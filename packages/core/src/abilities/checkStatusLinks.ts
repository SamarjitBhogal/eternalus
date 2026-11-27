import { ContentValidationError } from '../content/ContentValidationError';
import type { StatusEffectDefinition } from '../content/status-effects/statusEffects.types';
import type { AbilityRegistry } from './AbilityRegistry';

/** What is wrong with the ability `status` grants, or nothing. */
const grantProblems = (
  registry: Pick<AbilityRegistry, 'definitions'>,
  { id, grants }: StatusEffectDefinition,
): string[] => {
  if (grants === undefined) {
    return [];
  }
  const granted = registry.definitions.all().find((ability) => ability.id === grants);
  return granted === undefined
    ? [`Status "${id}" grants "${grants}", which names no ability.`]
    : granted.slot === 'granted'
      ? []
      : [`Status "${id}" grants "${grants}", which is not an ability of slot kind "granted".`];
};

/**
 * Checks, at boot, what a status names of the ability layer (architecture 05 §8): each `onHit` step
 * passes the registry's step check as a step of an `onHit` list (a strategy for every kind, each
 * step's own `validate`, a `hit` shape allowed, HC-B26 (5)), and a
 * `grants` id names an ability of slot kind `granted`. `loadStatusEffects` cannot: content does
 * not see the registry. `DefaultSystemPipeline` runs it where it loads the statuses.
 *
 * @throws ContentValidationError listing every problem of every status.
 */
export const checkStatusLinks = (
  registry: Pick<AbilityRegistry, 'definitions' | 'checkSteps'>,
  statuses: readonly StatusEffectDefinition[],
): void => {
  const problems = statuses.flatMap((status) => [
    ...registry.checkSteps(`Status "${status.id}" onHit`, status.onHit ?? [], { isOnHit: true }),
    ...grantProblems(registry, status),
  ]);
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
};

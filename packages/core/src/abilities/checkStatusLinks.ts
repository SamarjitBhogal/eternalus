import type { BuffSpec } from '../content/abilities/AbilityDefinition.types';
import { ContentValidationError } from '../content/ContentValidationError';
import type { StatusEffectDefinition } from '../content/status-effects/statusEffects.types';
import type { EffectStep } from './AbilityEffect.types';
import type { AbilityRegistry } from './AbilityRegistry';
import type { ComposableAbility } from './AbilityRegistry.types';

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

/** Whether `step` is a `buff` step (its `kind` names its shape). */
const isBuff = (step: EffectStep): step is BuffSpec => step.kind === 'buff';

/** What is wrong with `step` of passive `id`, or nothing (see `passiveProblems`). */
const passiveStepProblems = (
  id: string,
  step: ComposableAbility['effects'][number],
  permanent: ReadonlySet<string>,
): string[] => {
  const { delayTicks } = step;
  if (!isBuff(step)) {
    return [`Passive "${id}" has a "${step.kind}" step; a passive's steps are buffs.`];
  }
  const { statusId, durationTicks } = step;
  return [
    ...((delayTicks ?? 0) === 0
      ? []
      : [`Passive "${id}" buffs "${statusId}" after a delay; a passive's steps run at once.`]),
    ...(durationTicks === undefined
      ? []
      : [`Passive "${id}" gives "${statusId}" a time of its own; a passive's buffs have none.`]),
    ...(permanent.has(statusId)
      ? []
      : [`Passive "${id}" buffs "${statusId}", which does not last until removed.`]),
  ];
};

/**
 * What is wrong with `ability` if it is a passive, or nothing. A passive is a permanent buff (05
 * §7), so each of its steps is a `buff` that runs at once, with no time of its own, and its status
 * lasts until removed. Wrecking Run has no steps (DEC-338 (5)).
 */
const passiveProblems = (
  { id, slot, effects }: ComposableAbility,
  permanent: ReadonlySet<string>,
): string[] =>
  slot === 'passive' ? effects.flatMap((step) => passiveStepProblems(id, step, permanent)) : [];

/**
 * Checks, at boot, the links between the statuses and the ability layer (architecture 05 §7, §8):
 * each `onHit` step passes the registry's step check (a strategy for every kind, each step's own
 * `validate`), a `grants` id names an ability of slot kind `granted`, and each passive ability
 * puts on statuses that last until removed (DEC-361). `loadStatusEffects` cannot: content does
 * not see the registry. `DefaultSystemPipeline` runs it where it loads the statuses.
 *
 * @throws ContentValidationError listing every problem of every status.
 */
export const checkStatusLinks = (
  registry: Pick<AbilityRegistry, 'definitions' | 'checkSteps'>,
  statuses: readonly StatusEffectDefinition[],
): void => {
  const permanent = new Set(statuses.filter((s) => s.durationTicks === null).map((s) => s.id));
  const problems = [
    ...statuses.flatMap((status) => [
      ...registry.checkSteps(`Status "${status.id}" onHit`, status.onHit ?? []),
      ...grantProblems(registry, status),
    ]),
    ...registry.definitions.all().flatMap((ability) => passiveProblems(ability, permanent)),
  ];
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
};

import { isKinded } from '../content/abilities/isKinded';
import type { EffectStep } from './AbilityEffect.types';
import type { ShapeSpec, StepList } from './shapes/AreaShape.types';

/** The field name of an `onHit` list: a shot's (`ProjectileSpec.onHit`) or a status's. */
const ON_HIT = 'onHit';

/**
 * The step lists nested in `step` (a dash's `onPath` and `onEnd`, a shot's `onHit`): every list
 * field of kinded items, each with whether it is an `onHit` list.
 */
const childListsOf = (
  step: EffectStep,
): { readonly steps: EffectStep[]; readonly list: StepList }[] =>
  Object.entries(step).flatMap(([field, value]: [string, unknown]) =>
    Array.isArray(value)
      ? [{ steps: value.filter(isKinded), list: { isOnHit: field === ON_HIT } }]
      : [],
  );

/**
 * `steps` and every step nested in them, depth first, whatever their kinds, each with the list
 * that holds it (HC-B26 (5)): `list` is the list `steps` form, and a nested list is an `onHit`
 * list when its field is `onHit`.
 */
export const flattenSteps = (
  steps: readonly EffectStep[],
  list: StepList,
): { readonly step: EffectStep; readonly list: StepList }[] =>
  steps.flatMap((step) => [
    { step, list },
    ...childListsOf(step).flatMap((child) => flattenSteps(child.steps, child.list)),
  ]);

/** The step's area (its `shape` field), when it has one. */
export const shapeOf = (step: EffectStep): ShapeSpec | undefined =>
  'shape' in step && isKinded(step.shape) ? step.shape : undefined;

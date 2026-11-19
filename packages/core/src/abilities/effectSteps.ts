import { isKinded } from '../content/abilities/isKinded';
import type { EffectStep } from './AbilityEffect.types';
import type { ShapeSpec } from './shapes/AreaShape.types';

/** The steps nested in `step` (a dash's `onPath` and `onEnd`): every list field of kinded items. */
const childStepsOf = (step: EffectStep): EffectStep[] =>
  Object.values(step).flatMap((value: unknown) =>
    Array.isArray(value) ? value.filter(isKinded) : [],
  );

/** `steps` and every step nested in them, depth first, whatever their kinds. */
export const flattenSteps = (steps: readonly EffectStep[]): EffectStep[] =>
  steps.flatMap((step) => [step, ...flattenSteps(childStepsOf(step))]);

/** The step's area (its `shape` field), when it has one. */
export const shapeOf = (step: EffectStep): ShapeSpec | undefined =>
  'shape' in step && isKinded(step.shape) ? step.shape : undefined;

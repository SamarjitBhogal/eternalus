import type { EffectStep } from './AbilityEffect.types';
import type { ShapeSpec } from './shapes/AreaShape.types';

/** Whether `value` is an object with a string `kind` (a step or a shape). */
const isKinded = (value: unknown): value is EffectStep =>
  typeof value === 'object' && value !== null && 'kind' in value && typeof value.kind === 'string';

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

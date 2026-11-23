/**
 * The field checks the effect and shape strategies' `validate` share (architecture 05 §3). Each
 * returns the problem as `validate` reports it, or nothing.
 */

/** `name must be positive` unless `value` is a finite number above 0. */
export const mustBePositive = (value: number, name: string): readonly string[] =>
  value > 0 && Number.isFinite(value) ? [] : [`${name} must be positive`];

/** `name must be a fraction from 0 to 1` unless `value` is a number from 0 to 1. */
export const mustBeFraction = (value: number, name: string): readonly string[] =>
  value >= 0 && value <= 1 ? [] : [`${name} must be a fraction from 0 to 1`];

/** The problems of a step's health condition (`HealthCondition`): each bound a fraction. */
export const healthConditionProblems = (
  health: { readonly below?: number; readonly atOrAbove?: number } | undefined,
): readonly string[] => [
  ...(health?.below === undefined ? [] : mustBeFraction(health.below, 'health below')),
  ...(health?.atOrAbove === undefined ? [] : mustBeFraction(health.atOrAbove, 'health atOrAbove')),
];

/** `name must not be negative` unless `value` is absent or a finite number of 0 or more. */
export const mustNotBeNegative = (value: number | undefined, name: string): readonly string[] =>
  value === undefined || (value >= 0 && Number.isFinite(value))
    ? []
    : [`${name} must not be negative`];

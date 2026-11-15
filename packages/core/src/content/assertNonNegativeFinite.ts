import { ContentValidationError } from './ContentValidationError';

/**
 * Checks authored values before a loader converts them (a time to ticks, a rate per second to per
 * tick): each one is a finite number, 0 or more, so a loaded value is always usable.
 *
 * @param what - The content the message names ("aggro rules").
 * @param values - Each value as its label (definition id and field) and its authored value.
 * @param unit - The authored unit the message prints: `s` for a time, `per s` for a rate.
 * @throws ContentValidationError naming every value that is negative or not finite.
 */
export const assertNonNegativeFinite = (
  what: string,
  values: readonly (readonly [label: string, value: number])[],
  unit: 's' | 'per s' = 's',
): void => {
  const problems = values
    .filter(([, value]) => !(Number.isFinite(value) && value >= 0))
    .map(([label, value]) => `${label} is ${String(value)} ${unit}`);
  if (problems.length > 0) {
    throw new ContentValidationError(`Invalid ${what}: ${problems.join('; ')}`);
  }
};

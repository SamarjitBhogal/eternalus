import { ContentValidationError } from './ContentValidationError';

/**
 * Checks authored times (or rates per second) before a loader turns them into ticks (or rates per
 * tick): each one is a finite number, 0 or more, so a loaded value is always usable.
 *
 * @param what - The content the message names ("aggro rules").
 * @param times - Each value as its label (definition id and field) and its authored value.
 * @param unit - The authored unit the message prints: `s` for a time, `per s` for a rate.
 * @throws ContentValidationError naming every value that is negative or not finite.
 */
export const assertValidSeconds = (
  what: string,
  times: readonly (readonly [label: string, seconds: number])[],
  unit: 's' | 'per s' = 's',
): void => {
  const problems = times
    .filter(([, seconds]) => !(Number.isFinite(seconds) && seconds >= 0))
    .map(([label, seconds]) => `${label} is ${String(seconds)} ${unit}`);
  if (problems.length > 0) {
    throw new ContentValidationError(`Invalid ${what}: ${problems.join('; ')}`);
  }
};

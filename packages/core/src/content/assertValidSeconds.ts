import { ContentValidationError } from './ContentValidationError';

/**
 * Checks authored times before a loader turns them into ticks: each one is a finite number of
 * seconds, 0 or more, so a loaded duration is always a usable tick count.
 *
 * @param what - The content the message names ("aggro rules").
 * @param times - Each time as its label (definition id and field) and its value in seconds.
 * @throws ContentValidationError naming every time that is negative or not finite.
 */
export const assertValidSeconds = (
  what: string,
  times: readonly (readonly [label: string, seconds: number])[],
): void => {
  const problems = times
    .filter(([, seconds]) => !(Number.isFinite(seconds) && seconds >= 0))
    .map(([label, seconds]) => `${label} is ${String(seconds)} s`);
  if (problems.length > 0) {
    throw new ContentValidationError(`Invalid ${what}: ${problems.join('; ')}`);
  }
};

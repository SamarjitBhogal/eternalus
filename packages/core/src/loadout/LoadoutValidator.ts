import type { Loadout } from './Loadout.types';
import type { LoadoutContent, LoadoutProblem, LoadoutRule } from './LoadoutValidator.types';

/**
 * Checks a loadout against content with injected rules and reports every problem, not the first
 * (05 §12). A new slot or restriction is one `LoadoutRule` and one line in `defaultLoadoutRules`.
 */
export class LoadoutValidator {
  /** @param rules - The rules every loadout must pass. */
  public constructor(private readonly rules: readonly LoadoutRule[]) {}

  /** Every problem of `loadout`, in rule order; empty when it is valid. */
  public validate(loadout: Loadout, content: LoadoutContent): readonly LoadoutProblem[] {
    return this.rules.flatMap((rule) => rule.check(loadout, content));
  }
}

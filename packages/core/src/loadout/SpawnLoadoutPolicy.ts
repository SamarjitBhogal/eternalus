import { autoBuildLoadout, validateLoadout } from './loadoutApi';
import type { Loadout } from './Loadout.types';
import type { LoadoutContent, LoadoutProblem } from './LoadoutValidator.types';
import type { LoadoutRejection } from './SpawnLoadoutPolicy.types';

/**
 * Decides the loadout a Legend spawns with (05 §12, reference 08 "Invariant"): the given one when
 * `validateLoadout` accepts it for that class, else the class auto-build, reporting the rejection.
 * A Legend given none (every bot) gets the auto-build too. `Simulation` builds it over the match's
 * content and hands it to `EntityFactory` as its `LoadoutResolver`.
 */
export class SpawnLoadoutPolicy {
  /**
   * @param content - The Legend classes and weapons loadouts are checked against.
   * @param onRejected - Told of every rejected loadout (a diagnostic; `Simulation` logs it).
   */
  public constructor(
    private readonly content: LoadoutContent,
    private readonly onRejected: (rejection: LoadoutRejection) => void = () => undefined,
  ) {}

  /**
   * The loadout a `definitionId` spawn gets. `given` as it is for a definition that is not a Legend
   * class. Besides the loadout rules, `given` must be for that class (`class-matches-legend`, a
   * check only a spawn can make).
   */
  public loadoutFor(definitionId: string, given: Loadout | undefined): Loadout | undefined {
    if (!this.content.legends.has(definitionId)) return given;
    const used = autoBuildLoadout(definitionId, this.content);
    if (given === undefined) return used;
    const problems: LoadoutProblem[] = [...validateLoadout(given, this.content)];
    if (given.classId !== definitionId) {
      problems.unshift({
        field: 'class',
        ruleId: 'class-matches-legend',
        message: `loadout for class "${given.classId}" given to a "${definitionId}"`,
      });
    }
    if (problems.length === 0) return given;
    this.onRejected({ definitionId, given, problems, used });
    return used;
  }
}

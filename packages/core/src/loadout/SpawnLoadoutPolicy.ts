import { autoBuildLoadout, classDefaultLoadout, validateLoadout } from './loadoutApi';
import type { Loadout } from './Loadout.types';
import type { LoadoutContent, LoadoutProblem } from './LoadoutValidator.types';
import type { LoadoutRejection } from './SpawnLoadoutPolicy.types';

/**
 * Decides the loadout a Legend spawns with (05 §12, reference 08 "Invariant"): the given one when
 * `validateLoadout` accepts it for that class, else a fallback, reporting the rejection. The
 * fallback is the auto-build of the given loadout's Legend when that Legend belongs to the spawned
 * class, else the class default (`specId: null`). A spawn given no loadout gets the class default
 * too; a bot spawns so, because core's bot roster slot carries no Legend yet (05 §18). It reads
 * the given loadout's Legend only to check it and to pick the fallback (ADR 0018: the Legend pick
 * has no gameplay yet). `Simulation` builds it over the match's content and hands it to
 * `EntityFactory` as its `LoadoutResolver`.
 */
export class SpawnLoadoutPolicy {
  /**
   * @param content - The Legend classes, Legends and weapons loadouts are checked against.
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
    if (given === undefined) return classDefaultLoadout(definitionId, this.content);
    const problems: LoadoutProblem[] = [...validateLoadout(given, this.content)];
    if (given.classId !== definitionId) {
      problems.unshift({
        field: 'class',
        ruleId: 'class-matches-legend',
        message: `loadout for class "${given.classId}" given to a "${definitionId}"`,
      });
    }
    if (problems.length === 0) return given;
    const used = this.fallbackFor(definitionId, given.specId);
    this.onRejected({ definitionId, given, problems, used });
    return used;
  }

  /**
   * The loadout a rejected one is replaced with (05 §12: the factory substitutes
   * `autoBuildLoadout`): the auto-build of `specId` when it names a Legend of the class
   * `definitionId`. With no Legend, an unknown one or one of another class, the class default.
   */
  private fallbackFor(definitionId: string, specId: string | null): Loadout {
    const { specs } = this.content;
    const isLegendOfClass =
      specId !== null && specs.has(specId) && specs.get(specId).classId === definitionId;
    return isLegendOfClass
      ? autoBuildLoadout(specId, this.content)
      : classDefaultLoadout(definitionId, this.content);
  }
}

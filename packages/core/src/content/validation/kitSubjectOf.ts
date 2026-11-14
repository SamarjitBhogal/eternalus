import type { AbilityKit } from '../abilities/AbilityDefinition.types';
import type { ContentCatalogue } from '../ContentCatalogue';
import { LEGEND_KINDS } from '../legends/legendKinds';
import type { LegendDefinition } from '../legends/legends.types';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import type { UnitDefinition } from '../units/units.types';

/** What an ability rule checks about one Legend class or Legend spec. */
export type KitSubject = {
  /** The class whose abilities the kit may use. */
  readonly classId: string;
  /** The class's `abilityPool`. */
  readonly pool: readonly string[];
  /** The kit under check: a class's `defaultKit`, a spec's own `kit` (`null` = it has none). */
  readonly kit: AbilityKit | null;
  /** Whether the definition is the class itself (it owns the pool) and not a spec. */
  readonly isClass: boolean;
  /** What the messages call the kit. */
  readonly kitName: string;
};

/**
 * Reads the ability fields of a Legend class (`defaultKit`) or a Legend spec (`kit`), the one
 * place that knows both shapes, so the ability rules treat them alike. Returns `null` for any
 * other definition (a mob) and for a spec whose class is not loaded (`SpecClassExistsRule` flags
 * that).
 *
 * @param definition - A unit definition or a Legend spec.
 * @param legends - The loaded Legend classes, for a spec's class pool.
 */
export const kitSubjectOf = (
  definition: UnitDefinition | LegendSpecDefinition,
  legends: Pick<ContentCatalogue<LegendDefinition>, 'has' | 'get'>,
): KitSubject | null => {
  if ('classId' in definition) {
    return legends.has(definition.classId)
      ? {
          classId: definition.classId,
          pool: legends.get(definition.classId).abilityPool,
          kit: definition.kit,
          isClass: false,
          kitName: 'kit',
        }
      : null;
  }
  return LEGEND_KINDS.has(definition)
    ? {
        classId: definition.id,
        pool: definition.abilityPool,
        kit: definition.defaultKit,
        isClass: true,
        kitName: 'defaultKit',
      }
    : null;
};

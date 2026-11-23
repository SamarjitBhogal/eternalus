import type { AbilityBase } from '../abilities/AbilityDefinition.types';
import type { ContentCatalogue } from '../ContentCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import type { UnitDefinition } from '../units/units.types';
import type { ContentRule, UnitDefinitionRule } from './ContentValidator.types';
import { kitSubjectOf } from './kitSubjectOf';

/**
 * Every ability id a Legend class or spec names is a loaded ability of that class (a
 * dangling-reference rule, 04 §5): a class's `abilityPool`, `defaultKit` and `passiveOptions`, a
 * spec's own `kit` and `passiveId`. The kit's first three ids are `ability` slots and its last is an
 * `ultimate`; a passive id is a `passive` (05 §2, §12).
 */
export class KnownAbilityRefsRule implements UnitDefinitionRule, ContentRule<LegendSpecDefinition> {
  /**
   * @param abilities - The abilities content may name.
   * @param legends - The loaded Legend classes, for a spec's class.
   */
  public constructor(
    private readonly abilities: Pick<ContentCatalogue<AbilityBase>, 'has' | 'get'>,
    private readonly legends: Pick<ContentCatalogue<LegendDefinition>, 'has' | 'get'>,
  ) {}

  /** Flags an id with no ability, an ability of another class and an id in a slot of the wrong kind. */
  public check(definition: UnitDefinition | LegendSpecDefinition): readonly string[] {
    const subject = kitSubjectOf(definition, this.legends);
    if (subject === null) {
      return [];
    }
    const { classId, pool, kit, passiveOptions, passiveId, isClass, kitName } = subject;
    const named = [
      ...(isClass ? pool.map((id) => ['abilityPool', id, null] as const) : []),
      ...(isClass ? passiveOptions.map((id) => ['passiveOptions', id, 'passive'] as const) : []),
      ...(kit === null
        ? []
        : [
            ...kit.abilities.map((id) => [kitName, id, 'ability'] as const),
            [kitName, kit.ultimate, 'ultimate'] as const,
          ]),
      ...(passiveId === null ? [] : [['passiveId', passiveId, 'passive'] as const]),
    ];
    return named.flatMap(([where, id, slot]) => {
      if (!this.abilities.has(id)) {
        return [`${where} "${id}" names no ability`];
      }
      const ability = this.abilities.get(id);
      return [
        ...(ability.classId === classId
          ? []
          : [`${where} "${id}" belongs to class "${ability.classId}"`]),
        ...(slot === null || ability.slot === slot
          ? []
          : [`${where} "${id}" is not ${slot === 'passive' ? 'a' : 'an'} ${slot}`]),
      ];
    });
  }
}

import type { AbilityKit } from '../../abilities/AbilityDefinition.types';
import type { LegendDefinition } from '../legends.types';
import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * The kit a Legend equips (DEC-198, ADR 0026 decision 1): its spec's own kit, else its class's
 * `defaultKit`; the class's `defaultKit` when no spec is named. The one place of this rule: the
 * simulation's `Legend` and the client's kit rows both call it. A later kit change is a content
 * edit only.
 *
 * @param spec - The Legend spec, or `null` for none.
 * @param legend - The spec's class.
 */
export const kitOf = (
  spec: Pick<LegendSpecDefinition, 'kit'> | null,
  legend: Pick<LegendDefinition, 'defaultKit'>,
): AbilityKit => spec?.kit ?? legend.defaultKit;

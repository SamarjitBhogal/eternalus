import type { LegendDefinition } from '../legends.types';
import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * The passive a Legend has (DEC-330 P1, DEC-361): its spec's own `passiveId`, else its class's
 * `defaultPassiveId`; the class's when no spec is named. `null` = no passive. The passive's twin
 * of `kitOf`, and the one place of this rule.
 *
 * @param spec - The Legend spec, or `null` for none.
 * @param legend - The spec's class.
 */
export const passiveOf = (
  spec: Pick<LegendSpecDefinition, 'passiveId'> | null,
  legend: Pick<LegendDefinition, 'defaultPassiveId'>,
): string | null => spec?.passiveId ?? legend.defaultPassiveId;

import type { LegendDefinition } from '../legends.types';
import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * The id of the weapon a Legend spawns with (DEC-374; the sibling of `kitOf`): its spec's own
 * `primaryWeaponId`, else its class's `defaultLoadout`; the class's weapon when no spec is named.
 * The one place of this rule.
 *
 * @param spec - The Legend spec, or `null` for none.
 * @param legend - The spec's class.
 */
export const primaryWeaponIdOf = (
  spec: Pick<LegendSpecDefinition, 'primaryWeaponId'> | null,
  legend: Pick<LegendDefinition, 'defaultLoadout'>,
): string => spec?.primaryWeaponId ?? legend.defaultLoadout.primaryWeaponId;

import type { ShapedEffectSpec } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';

/**
 * The one overlay row of a step that acts on the targets in its `shape` (damage, knock-back,
 * debuff): its kind and its area (`AbilityEffect.describe`).
 */
export const areaRow = ({ kind, shape }: ShapedEffectSpec): readonly AbilityDisplayStep[] => [
  { kind, shape },
];

import type { LegendClassId, LegendDefinition } from '@eternalus/core';

/**
 * Each Legend class's sprite width by class id, in metres: core content `spriteWidth` (DEC-424).
 * The match draws each Legend's sprite at its class's width, and the player's camera scales with
 * the player's own width (`followViewFor`).
 */
export function legendSpriteWidthsOf(
  legends: readonly Pick<LegendDefinition, 'id' | 'spriteWidth'>[],
): Readonly<Record<LegendClassId, number>> {
  return Object.fromEntries(legends.map(({ id, spriteWidth }) => [id, spriteWidth]));
}

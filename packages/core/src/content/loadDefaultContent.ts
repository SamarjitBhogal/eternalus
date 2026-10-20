import { ContentCatalogue } from './ContentCatalogue';
import { createDefaultContentRules } from './defaultContentRules';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { MOB_DEFINITIONS } from './mobs/mobCatalogue';
import type { UnitDefinition } from './units/units.types';
import { ContentValidator } from './validation/ContentValidator';

const perTick = (definition: UnitDefinition, tickRate: number): UnitDefinition => ({
  ...definition,
  movement: {
    ...definition.movement,
    maxSpeed: definition.movement.maxSpeed / tickRate,
    acceleration: definition.movement.acceleration / (tickRate * tickRate),
  },
});

/**
 * Loads every shipped unit definition (Legends, then mobs), validates it once and converts its
 * speeds from per second to per tick, so the simulation only ever sees ticks (architecture 03 §11,
 * 02 §6).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @throws ContentValidationError listing every broken content rule.
 */
export const loadDefaultContent = (tickRate: number): ContentCatalogue<UnitDefinition> => {
  const authored = new ContentCatalogue<UnitDefinition>([
    ...LEGEND_CLASSES.all(),
    ...MOB_DEFINITIONS.all(),
  ]);
  new ContentValidator(createDefaultContentRules()).validate(authored);
  return new ContentCatalogue(authored.all().map((definition) => perTick(definition, tickRate)));
};

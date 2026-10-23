import { ContentCatalogue } from './ContentCatalogue';
import { createDefaultContentRules } from './defaultContentRules';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { MOB_DEFINITIONS } from './mobs/mobCatalogue';
import type { UnitDefinition } from './units/units.types';
import { TickRate } from '../utils/TickRate';
import { ContentValidator } from './validation/ContentValidator';
import { loadWeapons } from './weapons/loadWeapons';
import type { WeaponDefinition } from './weapons/weapons.types';

const perTick = (definition: UnitDefinition, tickRate: number, rate: TickRate): UnitDefinition => ({
  ...definition,
  movement: {
    ...definition.movement,
    maxSpeed: definition.movement.maxSpeed / tickRate,
    acceleration: definition.movement.acceleration / (tickRate * tickRate),
  },
  ...(definition.attack && {
    attack: {
      ...definition.attack,
      interval: rate.toTicks(definition.attack.interval),
    },
  }),
});

/**
 * Loads every shipped unit definition (Legends, then mobs), validates it once and converts its
 * speeds and attack intervals from per second to per tick, so the simulation only ever sees ticks (architecture 03 §11,
 * 02 §6).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param weapons - The weapons Legends may name; the shipped set by default.
 * @throws ContentValidationError listing every broken content rule.
 */
export const loadDefaultContent = (
  tickRate: number,
  weapons: ContentCatalogue<WeaponDefinition> = loadWeapons(tickRate),
): ContentCatalogue<UnitDefinition> => {
  const authored = new ContentCatalogue<UnitDefinition>([
    ...LEGEND_CLASSES.all(),
    ...MOB_DEFINITIONS.all(),
  ]);
  new ContentValidator(createDefaultContentRules(weapons)).validate(authored);
  const rate = new TickRate(tickRate);
  return new ContentCatalogue(
    authored.all().map((definition) => perTick(definition, tickRate, rate)),
  );
};

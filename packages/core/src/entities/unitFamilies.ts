/**
 * The entity families whose entities are units (architecture 04 §1): the abstract `Unit` family
 * itself and the Legends, mobs and bosses below it. Structures, zones, obstacles and projectiles
 * are no units.
 */
export const UNIT_FAMILIES: readonly string[] = ['unit', 'legend', 'mob', 'boss'];

/**
 * Whether `family` (an `EntitySnapshot.family`) names a unit family, so a client picks units
 * from a snapshot without keeping its own copy of the taxonomy.
 */
export const isUnitFamily = (family: string): boolean => UNIT_FAMILIES.includes(family);

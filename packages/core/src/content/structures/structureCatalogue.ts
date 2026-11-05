import { ContentCatalogue } from '../ContentCatalogue';
import { MAP_FEATURE_DEFINITIONS } from '../maps/mapFeatureDefinitions';
import type { StructureDefinition } from './structures.types';

/** The footprint the map generator stamps for `id`, so the collider and the nav grid agree. */
const footprintOf = (id: string): number => {
  const definition = MAP_FEATURE_DEFINITIONS[id];
  if (definition === undefined) {
    throw new Error(`Structure "${id}" has no map feature definition to take its footprint from.`);
  }
  return definition.footprintRadius;
};

/**
 * Walls and gates: breakable once two of the defender's three BuffTowers are down (game doc,
 * DISC-09), written as a fraction so it holds for any lane count (balancing.md).
 */
const AFTER_BUFF_TOWERS = { kind: 'allied-buff-towers-down', fraction: 2 / 3 } as const; // TUNE

/**
 * The lane structures (architecture 07 §1), keyed by the map's definition ids. Base health is
 * balancing.md's `Recommendation:`; shield bars arrive with the rest of Phase 2 sprint 2.1.
 */
export const STRUCTURE_DEFINITIONS: ContentCatalogue<StructureDefinition> =
  new ContentCatalogue<StructureDefinition>([
    {
      id: 'stronghold',
      kind: 'stronghold',
      displayName: 'Stronghold',
      baseHealth: 10_000, // TUNE: balancing.md
      footprintRadius: footprintOf('stronghold'),
      breakability: { kind: 'always' },
      hasMapFootprint: true, // DEC-185 D: melee at the palace wall is in reach
    },
    {
      id: 'spawner-tower',
      kind: 'spawner-tower',
      displayName: 'Spawner Tower',
      baseHealth: 3_000, // TUNE: balancing.md
      footprintRadius: footprintOf('spawner-tower'),
      breakability: { kind: 'always' },
      hasMapFootprint: true, // DEC-185: reach to the fort's walls; one pool, DEC-185 B
    },
    {
      id: 'buff-tower',
      kind: 'buff-tower',
      displayName: 'Buff Tower',
      baseHealth: 2_500, // TUNE: balancing.md
      footprintRadius: footprintOf('buff-tower'),
      breakability: { kind: 'always' },
      hasMapFootprint: true, // DEC-185: reach to the fort's walls; one pool, DEC-185 B
    },
    {
      id: 'gate',
      kind: 'gate',
      displayName: 'Gate',
      baseHealth: 3_000, // TUNE: balancing.md
      // TUNE: no reference value; the map gives each gate a polygon, the collider is a circle for now.
      footprintRadius: 3,
      breakability: AFTER_BUFF_TOWERS,
    },
    {
      id: 'forest-camp-light',
      kind: 'camp',
      displayName: 'Forest Camp (light)',
      baseHealth: 1, // never damaged: a camp is only its group's home
      footprintRadius: 1, // TUNE: no reference value; the map gives camps no footprint
      breakability: { kind: 'never' },
    },
    {
      id: 'forest-camp-medium',
      kind: 'camp',
      displayName: 'Forest Camp (medium)',
      baseHealth: 1, // never damaged: a camp is only its group's home
      footprintRadius: 1, // TUNE: no reference value; the map gives camps no footprint
      breakability: { kind: 'never' },
    },
    {
      id: 'forest-camp-heavy',
      kind: 'camp',
      displayName: 'Forest Camp (heavy)',
      baseHealth: 1, // never damaged: a camp is only its group's home
      footprintRadius: 1, // TUNE: no reference value; the map gives camps no footprint
      breakability: { kind: 'never' },
    },
  ]);

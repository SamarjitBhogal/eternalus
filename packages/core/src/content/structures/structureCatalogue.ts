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
 * DISC-09), written as a fraction so it holds for any lane count (balancing.md). The wall turrets
 * use it too, pending the owner.
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
      // No `hasMapFootprint`: the palace floor (its map object of the same id) is not part of it,
      // so a hit on the floor never takes its health (DEC-344 (4)). Its body is its outer walls and
      // throne (`MapObject.partOf`, DEC-373 (1)): one health pool, and melee at an outer wall is in
      // reach (DEC-185 D).
      hasFortBox: true, // DEC-217 (16): the box round its body is a fort box for the chase rule
    },
    {
      id: 'spawner-tower',
      kind: 'spawner-tower',
      displayName: 'Spawner Tower',
      baseHealth: 3_000, // TUNE: balancing.md
      footprintRadius: footprintOf('spawner-tower'),
      breakability: { kind: 'always' },
      hasMapFootprint: true, // DEC-185: reach to the fort's walls; one pool, DEC-185 B
      hasFortBox: true, // DEC-185: a chase closes in on a unit inside the fort
    },
    {
      id: 'buff-tower',
      kind: 'buff-tower',
      displayName: 'Buff Tower',
      baseHealth: 2_500, // TUNE: balancing.md
      footprintRadius: footprintOf('buff-tower'),
      breakability: { kind: 'always' },
      hasMapFootprint: true, // DEC-185: reach to the fort's walls; one pool, DEC-185 B
      hasFortBox: true, // DEC-185: a chase closes in on a unit inside the fort
    },
    {
      id: 'gate',
      kind: 'gate',
      displayName: 'Gate',
      baseHealth: 3_000, // TUNE: balancing.md
      // TUNE: no reference value; the collider circle only, reach is to the gate's polygon.
      footprintRadius: 3,
      breakability: AFTER_BUFF_TOWERS,
      // DEC-217 (17): reach to the gate's footprint, like towers. Its map object does not block,
      // so it is not the gate's body: the gate keeps its own health (DEC-217 (13)).
      hasMapFootprint: true,
    },
    {
      id: 'turret',
      kind: 'turret',
      displayName: 'Turret',
      baseHealth: 600, // TUNE: balancing.md
      footprintRadius: footprintOf('turret'),
      // DEC-341 (HC-Q90): damageable like the wall it sits on.
      breakability: AFTER_BUFF_TOWERS,
      // Reach to the turret's pylon. Its map object blocks, so it is the turret's body: one health
      // pool, no health of its own (as a lane tower's fort, DEC-185 B). It outlives the turret as
      // a ruin that blocks (DEC-341, HC-Q91).
      hasMapFootprint: true,
      controller: 'turret',
      aiProfile: 'wall-turret',
      ammo: ['bolt-heavy', 'bolt-default'], // balancing.md "Turrets — MVP": heavy for heavy targets
    },
    {
      id: 'forest-camp-light',
      kind: 'camp',
      displayName: 'Forest Camp (light)',
      baseHealth: 1, // never damaged: a camp is only its group's home
      footprintRadius: 1, // TUNE: no reference value; the map gives camps no footprint
      breakability: { kind: 'never' },
      canShotsFlyOver: true, // HC-Q105, HC-Q115: unseen inside its camp fire, which shots fly over
    },
    {
      id: 'forest-camp-medium',
      kind: 'camp',
      displayName: 'Forest Camp (medium)',
      baseHealth: 1, // never damaged: a camp is only its group's home
      footprintRadius: 1, // TUNE: no reference value; the map gives camps no footprint
      breakability: { kind: 'never' },
      canShotsFlyOver: true, // HC-Q105, HC-Q115: unseen inside its camp fire, which shots fly over
    },
    {
      id: 'forest-camp-heavy',
      kind: 'camp',
      displayName: 'Forest Camp (heavy)',
      baseHealth: 1, // never damaged: a camp is only its group's home
      footprintRadius: 1, // TUNE: no reference value; the map gives camps no footprint
      breakability: { kind: 'never' },
      canShotsFlyOver: true, // HC-Q105, HC-Q115: unseen inside its camp fire, which shots fly over
    },
  ]);

import { ContentCatalogue } from '../ContentCatalogue';
import { MAP_FEATURE_DEFINITIONS } from '../maps/mapFeatureDefinitions';
import { TOWER_AURA_BUFF } from '../status-effects/towerAuraBuff';
import { TOWER_AURA_DEBUFF } from '../status-effects/towerAuraDebuff';
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

/** A body no hit ever damages: one health it never loses, never breakable. */
const NEVER_DAMAGED = { baseHealth: 1, breakability: { kind: 'never' } } as const;

/** Every camp (forest and corner): only its group's home, never damaged. */
const CAMP_BODY = {
  ...NEVER_DAMAGED, // a camp is only its group's home
  kind: 'camp',
  footprintRadius: 1, // TUNE: no reference value; the map gives camps no footprint
} as const;

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
      hasFortBox: true, // DEC-217 (16): the palace box is a fort box for the chase rule
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
      aura: {
        radius: 12, // TUNE: DEC-315 (4), balancing.md 12 m
        allyStatusId: TOWER_AURA_BUFF.id,
        enemyStatusId: TOWER_AURA_DEBUFF.id,
      },
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
    ...(['light', 'medium', 'heavy'] as const).map((weight): StructureDefinition => ({
      ...CAMP_BODY,
      id: `forest-camp-${weight}`,
      displayName: `Forest Camp (${weight})`,
    })),
    // The corner camp is a `Camp` too: the home of its boss (guard plan `corner-camp`).
    { ...CAMP_BODY, id: 'corner-camp', displayName: 'Corner Camp' },
    {
      // Built at the `cathedral` feature, whose id it shares: the gem's own body, apart from the
      // building (DEC-292). Never damaged: the gem is unbreakable (DISC-11, DEC-292); the shared
      // spread is DEC-346 (tidy-ups).
      ...NEVER_DAMAGED,
      id: 'cathedral',
      kind: 'cathedral-gem',
      displayName: 'Cathedral gem',
      // TUNE: DEC-291 keeps the gem a 10 × 16 diamond; its hit and touch circle is the diamond's
      // half-width, in world units (`CathedralGemView` draws the diamond from this radius)
      footprintRadius: 5,
    },
  ]);

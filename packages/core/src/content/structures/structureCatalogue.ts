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
      // No `hasMapFootprint`: the palace floor (its map object of the same id) is not part of it,
      // so a hit on the floor never takes its health (DEC-344 (4)). Its body is its outer walls and
      // throne (`MapObject.partOf`, DEC-386 (1)): one health pool, and melee at an outer wall is in
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
      // DEC-302, DEC-342: the tower shoots orbs from its gem; its health, aura and waves are as before.
      controller: 'turret',
      aiProfile: 'lane-tower',
      ammo: ['tower-orb'],
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
      // DEC-302, DEC-342: the tower shoots orbs from its gem; its health, aura and waves are as before.
      controller: 'turret',
      aiProfile: 'lane-tower',
      ammo: ['tower-orb'],
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
      // Reach to the turret's pylon. The turret is mounted on the pylon (DEC-388). The pylon has its own health
      // and breaks under the turret's rule. Its fall takes the turret with it. The turret's fall
      // leaves it as a ruin that blocks, with its own health (DEC-341, HC-Q91).
      hasMapFootprint: true,
      isMounted: true,
      controller: 'turret',
      aiProfile: 'wall-turret',
      ammo: ['bolt-heavy', 'bolt-default'], // balancing.md "Turrets — MVP": heavy for heavy targets
    },
    ...(['light', 'medium', 'heavy'] as const).map((weight): StructureDefinition => ({
      ...CAMP_BODY,
      id: `forest-camp-${weight}`,
      displayName: `Forest Camp (${weight})`,
      canShotsFlyOver: true, // DEC-409 (1): unseen inside its camp fire, which shots fly over
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

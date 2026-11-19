import { STARTER_TUNING } from './starterTuning';

/** Point-projectile radius satisfies Transform's positive-radius boundary, without a hit-width bonus. */
export const STARTER_ENTITIES = [
  {
    id: 'hamstring-blade',
    kind: 'projectile',
    displayName: 'Hamstring blade',
    footprintRadius: Number.EPSILON,
    movementProfile: {
      maxSpeed: STARTER_TUNING.bladeSpeed,
      acceleration: STARTER_TUNING.bladeSpeed,
      mass: 1,
    },
  },
  {
    id: 'sanctuary-field',
    kind: 'ability-field',
    displayName: 'Sanctuary',
    minimapGlyph: { shape: 'ring', size: 0, colourRole: 'objective' },
  },
  {
    id: 'death-ray-field',
    kind: 'ability-field',
    displayName: 'Death Ray',
    minimapGlyph: { shape: 'ring', size: 0, colourRole: 'objective' },
  },
  // TUNE: balancing.md Shield Wall, 4 m wide and 800 health; no pick-up or burning.
  {
    id: 'ability-shield-wall',
    kind: 'obstacle',
    displayName: 'Shield Wall',
    obstacleType: 'rock',
    footprintRadius: 2,
    health: 800,
    isBurnable: false,
    weight: 1,
  },
] as const;

/** Geometry tessellation, not an ability range or balance parameter. */
export const FIELD_POLYGON_SIDES = 24;

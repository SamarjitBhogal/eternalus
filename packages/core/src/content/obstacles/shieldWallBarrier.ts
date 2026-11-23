import type { ObstacleDefinition } from './obstacles.types';

/** Along the wall, square to the aim, metres. TUNE: balancing.md:188 ("a 4 m wall"), reading R4. */
const LENGTH = 4;
/** Through the wall, along the aim, metres. TUNE: reading, owner card PR6 R4 */
const THICKNESS = 1;

/**
 * The body Shield Wall places (DEC-330 (7), reading R4): a 4 m by 1 m stone wall with 800 health
 * and no team, so every attack of either team damages it and it blocks walking and shots for both
 * (`EntitySummoner` makes its outline a wall). Its outline points +x along the aim, so its long
 * side is square to the aim (`ObstacleDefinition.footprint`).
 */
export const SHIELD_WALL_BARRIER = {
  id: 'shield-wall-barrier',
  kind: 'obstacle',
  obstacleType: 'barrier',
  displayName: 'Shield Wall',
  // The collider circle inside the outline; the outline is what blocks and is hit.
  footprintRadius: THICKNESS / 2,
  footprint: [
    { x: -THICKNESS / 2, y: -LENGTH / 2 },
    { x: THICKNESS / 2, y: -LENGTH / 2 },
    { x: THICKNESS / 2, y: LENGTH / 2 },
    { x: -THICKNESS / 2, y: LENGTH / 2 },
  ],
  health: 800, // TUNE: balancing.md:188
  isBurnable: false,
  // Nothing can carry it. TUNE: reading, owner card PR6 R4 (carry is not built, 07 §9)
  weight: Number.POSITIVE_INFINITY,
} as const satisfies ObstacleDefinition;

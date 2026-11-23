import type { Polygon } from '../../utils/geometry.types';
import type { EntityDefinitionBase } from '../EntityDefinition.types';

/**
 * A world object that blocks movement: a tree, a rock or a piece of bridge.
 * `kind` is always `obstacle` (the entity class); what it is lives in `obstacleType`
 * (`07-structures-obstacles-and-destructibles.md` section 9). Felling arrives with MVP-if-time.
 */
export type ObstacleDefinition = EntityDefinitionBase & {
  /** Which entity class builds it. */
  readonly kind: 'obstacle';
  /** What the obstacle is in the world. */
  readonly obstacleType: 'tree' | 'rock' | 'bridge-segment' | 'barrier';
  /** Collider circle radius in world units. */
  readonly footprintRadius: number;
  /**
   * The solid outline in metres around the obstacle's position, +x pointing the way it is placed
   * to face (`placePolygon`; 07 §9's `footprint`). The obstacle is hit, reached and shot on it, and
   * a summoned one blocks walking and paths on it (a Shield Wall, `EntitySummoner`). Absent: only
   * its collider circle.
   */
  readonly footprint?: Polygon;
  /** Health when it can be broken; `null` when it never breaks. */
  readonly health: number | null;
  readonly isBurnable: boolean;
  /** How heavy it is to pick up (`Carry` capacity checks). */
  readonly weight: number;
};

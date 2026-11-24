import { Collider } from '../components/Collider';
import { Deploying } from '../components/Deploying';
import { Movement } from '../components/Movement';
import type { Entity } from './Entity';

/**
 * Whether walls stop `entity` (DEC-363): a mover (`Movement`) with an enabled, non-static
 * collider that is not a shot (a projectile stops at what it hits, `ProjectileSystem`) and not a
 * mob walking out of the structure it spawned inside (`Deploying`, DEC-133). `CollisionSystem`
 * slides exactly these along walls, and only these are pushed out of a wall that is placed over
 * them (`EntitySummoner`) or that a body grows into (`BodySizeSystem`).
 */
export const isCollisionMover = (entity: Entity): boolean => {
  const collider = entity.findComponent(Collider);
  return (
    entity.hasComponent(Movement) &&
    collider?.isEnabled === true &&
    !collider.isStatic &&
    collider.layer !== 'projectile' &&
    !entity.hasComponent(Deploying)
  );
};

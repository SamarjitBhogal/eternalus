import { Combat } from '../components/Combat';
import { Transform } from '../components/Transform';
import { distance } from '../utils/geometry';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';
import { normalizeInto } from '../utils/vec2';
import type { MutableVec2 } from '../utils/vec2.types';
import type { GameState } from './GameState';
import type { EntityId } from './EntityStore.types';

/** Scratch for the aim point, then the aim direction (the simulation is single-threaded). */
const AIM: MutableVec2 = { x: 0, y: 0 };

/**
 * Whether a shot fired now from `attackerId` at `targetId` would reach the point it is aimed at
 * (`EntityStore.facingPointOf`) before a wall or the map's edge stops it: `CollisionQuery.reach`
 * from the attacker's centre must cover the distance less the shot's radius and `CONTACT_EPSILON`.
 * A melee attack, an attacker or target that is unknown, and a match with no collision rule have a
 * clear line, so a bot holds as it did before shots could be blocked.
 *
 * @param shotRadiusOf - The collider radius in metres of the projectile a ranged attack fires, by
 *   projectile id.
 */
export function hasLineOfFire(
  state: GameState,
  attackerId: EntityId,
  targetId: EntityId,
  shotRadiusOf: (projectileId: string) => number,
): boolean {
  const attack = state.entities.get(attackerId)?.findComponent(Combat)?.attack;
  const from = state.entities.get(attackerId)?.findComponent(Transform)?.position;
  if (
    state.collisions === null ||
    attack?.strategy !== 'ranged-projectile' ||
    from === undefined ||
    !state.entities.facingPointOf(attackerId, targetId, AIM)
  ) {
    return true;
  }
  const shotRadius = shotRadiusOf(attack.projectile.projectileId);
  const gap = distance(from, AIM);
  normalizeInto(AIM, { x: AIM.x - from.x, y: AIM.y - from.y });
  return state.collisions.reach(from, AIM, gap, shotRadius) >= gap - shotRadius - CONTACT_EPSILON;
}

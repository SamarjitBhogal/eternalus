import type { Movement } from '../components/Movement';
import type { Transform } from '../components/Transform';
import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import { cos, sin, sqrt } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';

/** Chooses a seeded patrol point inside a roaming post's leash, or its ordinary return point. */
export const guardDestination = (
  state: GameState,
  post: GuardSlot,
  movement: Movement,
  body: Transform | undefined,
): Vec2 => {
  const anchor = { x: post.postX, y: post.postY };
  if (body === undefined) return anchor;
  const radius = post.homeRadius + post.leashRadius - body.radius;
  if (radius <= 0) return anchor;
  const cadence = Math.ceil(radius / movement.maxSpeed);
  const random = state.rng.fork(post.id).fork(String(Math.floor(state.tick / cadence)));
  const direction = random.nextFloat() * 2 * Math.PI;
  const distance = sqrt(random.nextFloat()) * radius;
  const destination = {
    x: post.homeX + cos(direction) * distance,
    y: post.homeY + sin(direction) * distance,
  };
  const { x, y } = body.position;
  return state.world?.grid.isLineClear(x, y, destination.x, destination.y) === false
    ? anchor
    : destination;
};

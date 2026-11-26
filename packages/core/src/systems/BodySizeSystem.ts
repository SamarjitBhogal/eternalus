import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { isCollisionMover } from '../entities/isCollisionMover';
import { placeWithRoom } from '../state/placeWithRoom';
import type { System, SystemContext } from './System.types';

/**
 * Keeps each body's radius at its statuses' `size` (Berserk's 1.3, later `ascended` and
 * `eternal`): every tick it scales the `Transform` of each entity with `StatusEffects` to
 * `multiplier('size')`, so reach, areas, clicks, collision, the hash and the snapshot all read the
 * one radius. A body that grows and that walls stop (`isCollisionMover`) is pushed out of the walls
 * it now overlaps through the match's collision rule (`state.collisions.pushOut`); a body that
 * shrinks or stays the same is not moved. Where the push leaves the grown body in a wall (a gap
 * narrower than it), the body does not grow and does not move: it keeps its size and the system
 * tries again each tick, so it grows in the first tick it has room (architecture 10 §12,
 * `INBOX.md` HC-Q113). The room test is `placeWithRoom`, which also refuses a Berserk cast
 * without room (`no-room`, DEC-382). So this rule is the safety net for a body that grows in
 * another way: a wall placed later in the tick of the cast, or a later size status. It runs after
 * the casts and the statuses of the tick, so a size takes effect in the tick its status starts or
 * ends, and before movement.
 */
export class BodySizeSystem implements System {
  public readonly name = 'body-size';

  /**
   * Scales every body with statuses to its `size`. A mover that grows is pushed out of the walls,
   * or keeps its size where the push leaves it in one.
   */
  public update({ state }: SystemContext): void {
    const { collisions } = state;
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const statuses = entity.findComponent(StatusEffects);
      if (transform === undefined || statuses === undefined) return;
      const before = transform.scale;
      transform.resize(statuses.multiplier('size'));
      if (transform.scale <= before || collisions === null || !isCollisionMover(entity)) return;
      const freed = placeWithRoom(collisions, transform.position, transform.radius);
      if (freed !== null) transform.moveTo(freed);
      else transform.resize(before);
    });
  }
}

import type { Vec2 } from '../utils/geometry.types';

/**
 * A mob walking out of the structure it spawned inside (architecture 18 §3.2, DEC-133): it heads
 * straight for `exit`, past the structure's lane-facing opening, no wall holds it, and it has no
 * brain. `PathingSystem` removes this component once the mob's body stands wholly on walkable
 * ground or it reaches `exit`, and `HordeSystem` when it leaves its horde; its brain then engages.
 */
export class Deploying {
  /** @param exit - Where the mob heads; past the opening, on the far side of open ground. */
  public constructor(public readonly exit: Vec2) {}
}

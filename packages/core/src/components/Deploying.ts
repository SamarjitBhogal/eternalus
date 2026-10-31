import type { Vec2 } from '../utils/geometry.types';

/**
 * A mob walking out of the structure it spawned inside (architecture 18 §3.2, DEC-133): it heads
 * straight for `exit`, past the structure's lane-facing opening, no wall holds it, and it has no
 * brain. `PathingSystem` removes this component once the mob gets there; its brain then engages.
 */
export class Deploying {
  /** @param exit - Where the mob stands clear of the structure. */
  public constructor(public readonly exit: Vec2) {}
}

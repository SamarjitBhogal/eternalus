import type { Vec2 } from '../utils/geometry.types';

/** A Hamstring blade's remaining range and on-hit values, all already loaded in ticks. */
export class BladeFlight {
  public remaining: number;
  /** The point projectile has no additional gameplay hit radius. */
  public constructor(
    public readonly direction: Vec2,
    range: number,
    public readonly speedPerTick: number,
    public readonly damage: number,
    public readonly statusIds: readonly string[],
  ) {
    this.remaining = range;
  }
}

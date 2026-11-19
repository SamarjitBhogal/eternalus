import type { Vec2 } from '../utils/geometry.types';

/** A Death Ray's deterministic pulse cadence, direction and bounded lock extension. */
export class BeamChannel {
  public nextPulseTick: number;
  /** Stores only simulation data; services stay in the effect/system. */
  public constructor(
    public readonly direction: Vec2,
    public readonly range: number,
    public readonly width: number,
    public readonly damage: number,
    public readonly pulseTicks: number,
    public readonly maximumExpiryTick: number,
    tick: number,
  ) {
    this.nextPulseTick = tick + pulseTicks;
  }
}

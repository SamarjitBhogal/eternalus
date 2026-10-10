import type { Vec2 } from '../utils/geometry.types';
import { NEVER_REVEALED } from './Vision.constants';

/**
 * How far an entity sees, and until which tick it is revealed to the enemy (for example by a
 * scouting ability). Fog of war and targeting read it; it never moves anything.
 */
export class Vision {
  private revealedUntilTickValue = NEVER_REVEALED;

  /**
   * Creates vision with a sight radius, not revealed to anyone.
   *
   * @param radius - Sight radius in world units; must be a finite number ≥ 0.
   */
  public constructor(public readonly radius: number) {
    if (!(radius >= 0) || !Number.isFinite(radius)) {
      throw new Error(`Vision radius must be a finite number ≥ 0, got ${String(radius)}.`);
    }
  }

  /** The last tick this entity is revealed on; `NEVER_REVEALED` when it has never been revealed. */
  public get revealedUntilTick(): number {
    return this.revealedUntilTickValue;
  }

  /** Whether a point at `target` is within sight of an entity standing at `from`. */
  public canSee(from: Vec2, target: Vec2): boolean {
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  /** Reveals this entity until `tick`. A shorter reveal never cuts a longer one short. */
  public revealUntil(tick: number): void {
    this.revealedUntilTickValue = Math.max(this.revealedUntilTickValue, tick);
  }

  /** Whether this entity is revealed on `tick`. */
  public isRevealedAt(tick: number): boolean {
    return tick <= this.revealedUntilTickValue;
  }
}

import type { EntitySnapshot } from '@eternalus/core';
import type { SpriteRef, WorldPoint } from './engine/render/Renderer.types';
import { LEGEND_ANIMATION, LEGEND_ATLAS_ROWS } from './LegendAnimation.constants';

/**
 * One Legend's presentation state, driven by its weapon hits and its observed motion. It reads no
 * events itself: `LegendSprites` owns the one `damage-applied` listener and tells it when its
 * Legend struck.
 */
export class LegendAnimation {
  private attackStartedTick: number | null = null;
  private walkRow: number = LEGEND_ATLAS_ROWS.south;
  private isMoving = false;
  private idleRow: number = LEGEND_ATLAS_ROWS.idle;
  /** The tick of the last observed snapshot with a place, or `null` for none. */
  private lastTick: number | null = null;
  /** Where the Legend stood on `lastTick`. */
  private lastX = 0;
  private lastY = 0;
  /** Animates one Legend from the atlas `atlasId` (its sub-class's sheet). */
  public constructor(
    private readonly atlasId: string,
    private readonly tickRate: number,
  ) {}
  /** The Legend struck with its weapon on `tick`: the attack row plays from then. */
  public attackStarted(tick: number): void {
    this.attackStartedTick = tick;
  }
  /**
   * Follows the Legend to its snapshot of `tick`. It compares the place with the place it kept
   * from the tick before. A Legend that it did not see on the tick before is new (a spawn or a
   * respawn), so it does not walk. It uses the actual step, so walking against a wall does not
   * run in place.
   */
  public observe(entity: EntitySnapshot, tick: number): void {
    const to = entity.transform;
    const wasSeen = to !== null && this.lastTick === tick - 1;
    const dx = wasSeen ? to.x - this.lastX : 0;
    const dy = wasSeen ? to.y - this.lastY : 0;
    this.isMoving = Math.abs(dx) + Math.abs(dy) > Number.EPSILON;
    this.lastTick = to === null ? null : tick;
    if (to !== null) {
      this.lastX = to.x;
      this.lastY = to.y;
      this.idleRow = LegendAnimation.rowFor(to.facing, LEGEND_ATLAS_ROWS.idle);
    }
    if (this.isMoving) {
      this.walkRow = LegendAnimation.rowFor({ x: dx, y: dy }, LEGEND_ATLAS_ROWS.south);
    }
  }
  /** Returns the frame for the Legend at `tick`, or `null` once it is dead. */
  public frame(entity: EntitySnapshot, tick: number): SpriteRef | null {
    const { atlasId } = this;
    if (entity.health === null || entity.health.current <= 0) return null;
    const elapsed =
      this.attackStartedTick === null ? Infinity : (tick - this.attackStartedTick) / this.tickRate;
    const isAttacking = elapsed >= 0 && elapsed < LEGEND_ANIMATION.attackSeconds;
    const row = isAttacking
      ? LEGEND_ATLAS_ROWS.attack
      : this.isMoving
        ? this.walkRow
        : this.idleRow;
    const seconds = isAttacking
      ? elapsed
      : !this.isMoving && this.idleRow !== LEGEND_ATLAS_ROWS.idle
        ? 0
        : tick / this.tickRate;
    const duration = isAttacking
      ? LEGEND_ANIMATION.attackSeconds
      : this.isMoving
        ? LEGEND_ANIMATION.walkSeconds
        : LEGEND_ANIMATION.idleSeconds;
    const frame =
      Math.floor((seconds / duration) * LEGEND_ANIMATION.frames) % LEGEND_ANIMATION.frames;
    return { atlasId, frame: row * LEGEND_ANIMATION.frames + frame };
  }

  /**
   * The atlas row of a direction: east or west when it is mostly sideways, else north when it
   * points up the screen, else `southRow` (the idle row for a facing, the south walk for a step).
   */
  private static rowFor(direction: WorldPoint, southRow: number): number {
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      return direction.x > 0 ? LEGEND_ATLAS_ROWS.east : LEGEND_ATLAS_ROWS.west;
    }
    return direction.y < 0 ? LEGEND_ATLAS_ROWS.north : southRow;
  }
}

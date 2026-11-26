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
   * Follows the Legend from its last tick's snapshot (`before`, `null` when it is new) to this
   * tick's (`after`, `null` when it is gone). Uses actual displacement, so walking against a wall
   * does not run in place.
   */
  public observe(before: EntitySnapshot | null, after: EntitySnapshot | null): void {
    const from = before?.transform;
    const to = after?.transform;
    const hasBoth = from !== undefined && from !== null && to !== undefined && to !== null;
    const step = hasBoth ? { x: to.x - from.x, y: to.y - from.y } : { x: 0, y: 0 };
    this.isMoving = Math.abs(step.x) + Math.abs(step.y) > Number.EPSILON;
    const facing = to?.facing;
    if (facing !== undefined) {
      this.idleRow = LegendAnimation.rowFor(facing, LEGEND_ATLAS_ROWS.idle);
    }
    if (this.isMoving) {
      this.walkRow = LegendAnimation.rowFor(step, LEGEND_ATLAS_ROWS.south);
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

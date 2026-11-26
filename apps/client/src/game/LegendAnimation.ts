import type { EntitySnapshot, Simulation, Snapshot, Unsubscribe } from '@eternalus/core';
import type { SpriteRef, WorldPoint } from './engine/render/Renderer.types';
import { LEGEND_ANIMATION, LEGEND_ATLAS_ROWS } from './LegendAnimation.constants';

/** Match-owned presentation state driven by the player's weapon hits and observed motion. */
export class LegendAnimation {
  private attackStartedTick: number | null = null;
  private walkRow: number = LEGEND_ATLAS_ROWS.south;
  private isMoving = false;
  private idleRow: number = LEGEND_ATLAS_ROWS.idle;
  private readonly unsubscribe: readonly Unsubscribe[];
  /**
   * Animates only the player's Legend (`playerId`) from the atlas `atlasId` (the player's sheet);
   * with either `null`, every frame is `null` and nothing is subscribed.
   */
  public constructor(
    private readonly playerId: string | null,
    private readonly atlasId: string | null,
    private readonly tickRate: number,
    simulation: Pick<Simulation, 'on' | 'tick'>,
  ) {
    if (playerId === null || atlasId === null) {
      this.unsubscribe = [];
      return;
    }
    this.unsubscribe = [
      simulation.on('damage-applied', ({ source }) => {
        if (source.attackerId === playerId && source.kind === 'weapon')
          this.attackStartedTick = simulation.tick;
      }),
    ];
  }
  /** Uses actual displacement, so walking against a wall does not run in place. */
  public observe(previous: Snapshot | null, current: Snapshot): void {
    const before = previous?.entities.find((entity) => entity.id === this.playerId)?.transform;
    const after = current.entities.find((entity) => entity.id === this.playerId)?.transform;
    const hasBoth =
      before !== undefined && before !== null && after !== undefined && after !== null;
    const step = hasBoth ? { x: after.x - before.x, y: after.y - before.y } : { x: 0, y: 0 };
    this.isMoving = Math.abs(step.x) + Math.abs(step.y) > Number.EPSILON;
    const facing = after?.facing;
    if (facing !== undefined) {
      this.idleRow = LegendAnimation.rowFor(facing, LEGEND_ATLAS_ROWS.idle);
    }
    if (this.isMoving) {
      this.walkRow = LegendAnimation.rowFor(step, LEGEND_ATLAS_ROWS.south);
    }
  }
  /** Returns a frame only for a living selected Legend with a known sheet. */
  public frame(entity: EntitySnapshot, tick: number): SpriteRef | null {
    const { atlasId } = this;
    if (
      entity.id !== this.playerId ||
      entity.family !== 'legend' ||
      entity.health === null ||
      entity.health.current <= 0 ||
      atlasId === null
    )
      return null;
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
  /** Releases every event subscription with the match. */
  public destroy(): void {
    for (const unsubscribe of this.unsubscribe) unsubscribe();
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

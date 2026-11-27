import type { EntitySnapshot, Simulation, Snapshot, Unsubscribe } from '@eternalus/core';
import type { SpriteRef } from './engine/render/Renderer.types';
import { LEGEND_ANIMATION, LEGEND_ATLAS_ROWS, LEGEND_ATLASES } from './LegendAnimation.constants';

/** Match-owned presentation state driven by successful simulation events and observed motion. */
export class LegendAnimation {
  private attackTick: number | null = null;
  private walkRow: number = LEGEND_ATLAS_ROWS.south;
  private isMoving = false;
  private idleRow: number = LEGEND_ATLAS_ROWS.idle;
  private readonly unsubscribe: readonly Unsubscribe[];
  /** Only the selected player's skin is replaced; other Legends retain their existing view. */
  public constructor(
    private readonly playerId: string | null,
    private readonly specId: string | null,
    private readonly tickRate: number,
    simulation: Pick<Simulation, 'on' | 'tick'>,
  ) {
    if (playerId === null || LEGEND_ATLASES[specId ?? ''] === undefined) {
      this.unsubscribe = [];
      return;
    }
    this.unsubscribe = [
      simulation.on('damage-applied', ({ source }) => {
        if (source.attackerId === playerId && source.kind === 'weapon')
          this.attackTick = simulation.tick;
      }),
    ];
  }
  /** Uses actual displacement, so walking against a wall does not run in place. */
  public observe(previous: Snapshot | null, current: Snapshot): void {
    const before = previous?.entities.find((entity) => entity.id === this.playerId)?.transform;
    const after = current.entities.find((entity) => entity.id === this.playerId)?.transform;
    const dx =
      before === undefined || before === null || after === undefined || after === null
        ? 0
        : after.x - before.x;
    const dy =
      before === undefined || before === null || after === undefined || after === null
        ? 0
        : after.y - before.y;
    this.isMoving = Math.abs(dx) + Math.abs(dy) > Number.EPSILON;
    const facing = after?.facing;
    if (facing !== undefined) {
      this.idleRow =
        Math.abs(facing.x) > Math.abs(facing.y)
          ? facing.x > 0
            ? LEGEND_ATLAS_ROWS.east
            : LEGEND_ATLAS_ROWS.west
          : facing.y < 0
            ? LEGEND_ATLAS_ROWS.north
            : LEGEND_ATLAS_ROWS.idle;
    }
    if (this.isMoving) {
      this.walkRow =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? LEGEND_ATLAS_ROWS.east
            : LEGEND_ATLAS_ROWS.west
          : dy > 0
            ? LEGEND_ATLAS_ROWS.south
            : LEGEND_ATLAS_ROWS.north;
    }
  }
  /** Returns a frame only for a living selected Legend with a known sheet. */
  public frame(entity: EntitySnapshot, tick: number): SpriteRef | null {
    const atlasId = LEGEND_ATLASES[this.specId ?? '']?.atlasId;
    if (
      entity.id !== this.playerId ||
      entity.family !== 'legend' ||
      entity.health === null ||
      entity.health.current <= 0 ||
      atlasId === undefined
    )
      return null;
    const elapsed = this.attackTick === null ? Infinity : (tick - this.attackTick) / this.tickRate;
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
}

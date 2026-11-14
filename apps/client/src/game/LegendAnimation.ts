import type { EntitySnapshot, Simulation, Snapshot, Unsubscribe } from '@eternalus/core';
import type { SpriteRef } from './engine/render/Renderer.types';
import {
  LEGEND_ANIMATION,
  LEGEND_CAST_ROWS,
  LEGEND_CAST_SECONDS,
  LEGEND_EFFECT_HISTORY,
  LEGEND_SKINS,
  RANGED_LEGEND_SKINS,
} from './LegendAnimation.constants';
import type { LegendCastFrame, LegendCastPose, LegendPose } from './LegendAnimation.types';

/** Match-owned presentation state driven by successful simulation events and observed motion. */
export class LegendAnimation {
  private pose: LegendPose | null = null;
  private walkRow = 1;
  private isMoving = false;
  private position = { x: 0, y: 0 };
  private direction = { x: 1, y: 0 };
  private casts: readonly LegendCastPose[] = [];
  private readonly unsubscribe: readonly Unsubscribe[];
  /** Only the selected player's skin is replaced; other Legends retain their existing view. */
  public constructor(
    private readonly playerId: string | null,
    private readonly specId: string | null,
    private readonly tickRate: number,
    simulation: Pick<Simulation, 'on' | 'tick'>,
  ) {
    if (playerId === null || LEGEND_SKINS[specId ?? ''] === undefined) {
      this.unsubscribe = [];
      return;
    }
    this.unsubscribe = [
      simulation.on('damage-applied', ({ source }) => {
        if (
          source.attackerId === playerId &&
          source.kind === 'weapon' &&
          !RANGED_LEGEND_SKINS.has(specId ?? '')
        )
          this.attack(simulation.tick);
      }),
      simulation.on('ability-previewed', (event) => {
        if (event.casterId === playerId) this.cast(event.abilityId, simulation.tick);
      }),
      simulation.on('projectile-fired', (event) => {
        if (event.attackerId === playerId) this.attack(simulation.tick);
      }),
      simulation.on('ability-cast', (event) => {
        if (event.casterId === playerId) this.cast(event.abilityId, simulation.tick);
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
    if (after !== undefined && after !== null) this.position = { x: after.x, y: after.y };
    if (this.isMoving) {
      this.walkRow = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 4 : 3) : dy > 0 ? 1 : 2;
      const length = Math.hypot(dx, dy);
      this.direction = { x: dx / length, y: dy / length };
    }
  }
  /** Returns a frame only for a living selected Legend with a known sheet. */
  public frame(entity: EntitySnapshot, tick: number): SpriteRef | null {
    const atlasId = LEGEND_SKINS[this.specId ?? ''];
    if (
      entity.id !== this.playerId ||
      entity.family !== 'legend' ||
      entity.health === null ||
      entity.health.current <= 0 ||
      atlasId === undefined
    )
      return null;
    const elapsed = this.pose === null ? Infinity : (tick - this.pose.startedTick) / this.tickRate;
    const isCasting = this.pose !== null && elapsed >= 0 && elapsed < this.pose.duration;
    const row = isCasting ? (this.pose?.row ?? 0) : this.isMoving ? this.walkRow : 0;
    const seconds = isCasting ? elapsed : tick / this.tickRate;
    const duration = isCasting
      ? (this.pose?.duration ?? 1)
      : this.isMoving
        ? LEGEND_ANIMATION.walkSeconds
        : LEGEND_ANIMATION.idleSeconds;
    const frame =
      Math.floor((seconds / duration) * LEGEND_ANIMATION.frames) % LEGEND_ANIMATION.frames;
    return { atlasId, frame: row * LEGEND_ANIMATION.frames + frame };
  }
  /** Retains recent non-Magus casts at their original location, with a strict lifetime and cap. */
  public effects(tick: number): readonly LegendCastFrame[] {
    const atlasId = LEGEND_SKINS[this.specId ?? ''];
    if (atlasId === undefined) return [];
    return this.casts.flatMap((cast) => {
      const age = (tick - cast.startedTick) / this.tickRate;
      if (age < 0 || age >= LEGEND_EFFECT_HISTORY.seconds) return [];
      return [
        {
          atlasId,
          row: cast.row,
          origin: cast.origin,
          direction: cast.direction,
          progress: Math.min(1, age / cast.duration),
          fade:
            1 - Math.max(0, age - cast.duration) / (LEGEND_EFFECT_HISTORY.seconds - cast.duration),
        },
      ];
    });
  }
  private attack(tick: number): void {
    // A real hit must not cut a longer preview back to its first attack frame.
    if (
      !RANGED_LEGEND_SKINS.has(this.specId ?? '') &&
      this.pose !== null &&
      this.pose.row >= 6 &&
      tick < this.pose.startedTick + this.pose.duration * this.tickRate
    )
      return;
    this.pose = { row: 5, startedTick: tick, duration: LEGEND_ANIMATION.attackSeconds };
  }
  private cast(abilityId: string, tick: number): void {
    const row = LEGEND_CAST_ROWS[abilityId];
    if (row === undefined) return;
    const duration = LEGEND_CAST_SECONDS[abilityId] ?? LEGEND_ANIMATION.castSeconds;
    this.pose = { row, startedTick: tick, duration };
    if (!RANGED_LEGEND_SKINS.has(this.specId ?? ''))
      this.casts = [
        ...this.casts.slice(1 - LEGEND_EFFECT_HISTORY.limit),
        {
          ...this.pose,
          origin: this.position,
          direction: this.direction,
        },
      ];
  }
  /** Releases every event subscription with the match. */
  public destroy(): void {
    for (const unsubscribe of this.unsubscribe) unsubscribe();
    this.casts = [];
  }
}

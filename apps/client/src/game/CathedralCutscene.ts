import type { Simulation, Snapshot, Unsubscribe } from '@eternalus/core';

import { CUTSCENE, ERUPTION_ENTRY } from './CathedralCutscene.constants';
import type { WorldPoint } from './engine/render/Renderer.types';
import type { EruptionBurst } from './views/EruptionView.types';

/**
 * The mid-game cut-scene (Aryan 2026-11-22): the camera turns to the Cathedral just before the gem
 * erupts, holds there while it bursts and the Greater Boss appears, then goes back to the player.
 * Only the view: the match runs on and the player keeps control. A fresh move press (not a key
 * held from before) skips it. Nothing plays in a Duel, which has no boss. It reads the eruption's
 * tick from the snapshot's `upcoming` timeline and the gem's place from the gem entity, and starts
 * the burst when the gem erupts (`greater-boss-summoned`).
 */
export class CathedralCutscene {
  private readonly panTicks: number;

  private readonly holdTicks: number;

  private readonly burstTicks: number;

  private readonly unsubscribe: Unsubscribe;

  private tick = 0;

  private eruptionTick: number | null = null;

  private gemAt: WorldPoint | null = null;

  private isDuel = false;

  private isSkipped = false;

  private wasMoving = true;

  private hasErupted = false;

  private burstTick: number | null = null;

  /**
   * @param simulation - Where `greater-boss-summoned` is heard.
   * @param tickRate - Ticks per second, to turn the `CUTSCENE` seconds into ticks.
   */
  public constructor(simulation: Pick<Simulation, 'on'>, tickRate: number) {
    this.panTicks = Math.round(CUTSCENE.panSeconds * tickRate);
    this.holdTicks = Math.round(CUTSCENE.holdSeconds * tickRate);
    this.burstTicks = Math.round(CUTSCENE.burstSeconds * tickRate);
    this.unsubscribe = simulation.on('greater-boss-summoned', () => {
      this.hasErupted = true;
    });
  }

  /**
   * Reads the latest snapshot, after each step: the tick, the eruption's tick while it is still
   * upcoming, the gem's place while it stands, and whether the player started moving (`isMoving`,
   * this tick's movement input), which skips a playing cut-scene.
   */
  public observe(snapshot: Snapshot, isMoving: boolean): void {
    this.tick = snapshot.tick;
    this.isDuel = snapshot.match.duel !== undefined;
    const eruption = snapshot.match.upcoming.find(({ entryId }) => entryId === ERUPTION_ENTRY);
    if (eruption !== undefined) this.eruptionTick = eruption.tick;
    const gem = snapshot.entities.find(({ kind }) => kind === 'cathedral-gem');
    if (gem?.transform != null) this.gemAt = { x: gem.transform.x, y: gem.transform.y };
    if (this.hasErupted && this.burstTick === null) this.burstTick = this.tick;
    if (this.isPlaying() && isMoving && !this.wasMoving) this.isSkipped = true;
    this.wasMoving = isMoving;
  }

  /**
   * Where the camera looks now: the Cathedral, shaking while it bursts, or `null` when no
   * cut-scene plays (the camera follows the player).
   */
  public focus(): WorldPoint | null {
    if (!this.isPlaying() || this.gemAt === null) return null;
    const burst = this.burst();
    if (burst === null) return this.gemAt;
    const { amplitude, ticksPerSwing } = CUTSCENE.shake;
    const side = this.tick % (2 * ticksPerSwing) < ticksPerSwing ? 1 : -1;
    const swing = (1 - burst.progress) * amplitude * side;
    return { x: this.gemAt.x + swing, y: this.gemAt.y - swing / 2 };
  }

  /** The gem's burst while it lasts, or `null`. */
  public burst(): EruptionBurst | null {
    if (this.burstTick === null || this.gemAt === null) return null;
    const progress = (this.tick - this.burstTick) / this.burstTicks;
    return progress < 1 ? { at: this.gemAt, progress } : null;
  }

  /** Stops listening to the simulation. */
  public destroy(): void {
    this.unsubscribe();
  }

  /** Whether the camera belongs to the cut-scene this tick. */
  private isPlaying(): boolean {
    const at = this.eruptionTick;
    return (
      at !== null &&
      !this.isDuel &&
      !this.isSkipped &&
      this.tick >= at - this.panTicks &&
      this.tick < at + this.holdTicks
    );
  }
}

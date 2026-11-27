import { GEM_ERUPTION_ENTRY_ID } from '@eternalus/core';
import type { Simulation, Snapshot, Unsubscribe } from '@eternalus/core';

import { CUTSCENE } from './CathedralCutscene.constants';
import type { WorldPoint } from './engine/render/Renderer.types';
import type { EruptionBurst } from './views/EruptionView.types';

/**
 * The mid-game cut-scene (Aryan 2026-11-22): the camera turns to the Cathedral just before the gem
 * erupts, holds there while it bursts and the Greater Boss appears, then goes back to the player.
 * Only the view: the match runs on and the player keeps control. A fresh move press (not a key
 * held from before) skips it. It plays only for a player whose Legend is near the Cathedral
 * (DEC-371 E1); a player far away keeps their own view and sees the burst on the minimap
 * (`EruptionView`). Nothing plays in a Duel, which has no boss. It reads the eruption's
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

  /** Whether the player was near the Cathedral when the cut-scene would start; `null` before. */
  private wasNearAtStart: boolean | null = null;

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
   * upcoming, the gem's place once it is seen, whether the player's Legend (`playerAt`, `null`
   * when it is dead or not spawned) is near the Cathedral on the cut-scene's first tick (kept
   * after that, so a Legend the blast kills still sees it end), and whether the player started
   * moving (`isMoving`, this tick's movement input), which skips a playing cut-scene.
   */
  public observe(snapshot: Snapshot, isMoving: boolean, playerAt: WorldPoint | null): void {
    this.tick = snapshot.tick;
    this.isDuel = snapshot.match.duel !== undefined;
    const eruption = snapshot.match.upcoming.find(
      ({ entryId }) => entryId === GEM_ERUPTION_ENTRY_ID,
    );
    if (eruption !== undefined) this.eruptionTick = eruption.tick;
    // The gem never moves, so it is looked up only until it is found.
    if (this.gemAt === null) {
      const gem = snapshot.entities.find(({ kind }) => kind === 'cathedral-gem');
      if (gem?.transform != null) this.gemAt = { x: gem.transform.x, y: gem.transform.y };
    }
    if (this.wasNearAtStart === null && this.isInWindow()) {
      this.wasNearAtStart = this.isNear(playerAt);
    }
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
    const { amplitude, ticksPerSwing, verticalShare } = CUTSCENE.shake;
    const side = this.tick % (2 * ticksPerSwing) < ticksPerSwing ? 1 : -1;
    const swing = (1 - burst.progress) * amplitude * side;
    return { x: this.gemAt.x + swing, y: this.gemAt.y - swing * verticalShare };
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
    return !this.isDuel && !this.isSkipped && this.wasNearAtStart === true && this.isInWindow();
  }

  /** Whether this tick is between the pan's start and the hold's end. */
  private isInWindow(): boolean {
    const at = this.eruptionTick;
    return at !== null && this.tick >= at - this.panTicks && this.tick < at + this.holdTicks;
  }

  /** Whether `playerAt` is within `CUTSCENE.nearRadius` of the gem (DEC-371 E1). */
  private isNear(playerAt: WorldPoint | null): boolean {
    const gem = this.gemAt;
    return (
      gem !== null &&
      playerAt !== null &&
      Math.hypot(playerAt.x - gem.x, playerAt.y - gem.y) <= CUTSCENE.nearRadius
    );
  }
}

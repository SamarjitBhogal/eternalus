import type { WorldPoint } from '../engine/render/Renderer.types';
import { KNIGHT_ACTIONS, KNIGHT_ATLAS } from './KnightAnimation.constants';
import type { KnightAction, KnightPose } from './KnightAnimation.types';

/** Samples observed movement and combat using injected simulation time. */
export class KnightAnimation {
  private position: WorldPoint | null = null;
  private direction = 1;
  private isMoving = false;
  private action: { readonly name: KnightAction; readonly start: number } | null = null;

  /** Observes actual displacement, including stops at obstacles. */
  public observe(position: WorldPoint | null): void {
    const dx = position !== null && this.position !== null ? position.x - this.position.x : 0;
    const dy = position !== null && this.position !== null ? position.y - this.position.y : 0;
    this.isMoving = Math.hypot(dx, dy) > 0.00001;
    if (this.isMoving)
      this.direction = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 3 : 4) : dy < 0 ? 2 : 1;
    this.position = position;
  }

  /** Plays once, protecting ability playback against repeated weapon hits. */
  public play(name: KnightAction, seconds: number): void {
    if (
      name === 'attack' &&
      this.action !== null &&
      this.action.name !== 'attack' &&
      seconds - this.action.start < KNIGHT_ACTIONS[this.action.name].seconds
    )
      return;
    this.action = { name, start: seconds };
  }

  /** Returns a bounded frame; completed clips resume idle or walking. */
  public sample(seconds: number): KnightPose {
    const clip = this.action === null ? null : KNIGHT_ACTIONS[this.action.name];
    const elapsed = this.action === null ? 0 : seconds - this.action.start;
    const active = clip !== null && elapsed >= 0 && elapsed < clip.seconds;
    return {
      position: this.position,
      row: active ? clip.row : this.isMoving ? this.direction : 0,
      frame: active
        ? Math.floor((elapsed / clip.seconds) * KNIGHT_ATLAS.columns)
        : Math.floor(seconds * (this.isMoving ? 10 : 6)) % KNIGHT_ATLAS.columns,
    };
  }
}

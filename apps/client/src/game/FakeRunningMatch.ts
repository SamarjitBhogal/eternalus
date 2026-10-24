import type { RunningMatch } from './SessionController.types';

/** Test double of a running match (02 §8): counts `destroy()` calls and records every pause. */
export class FakeRunningMatch implements RunningMatch {
  /** Every `setPaused` argument, in call order. */
  public readonly pauses: boolean[] = [];
  private destroys = 0;

  /** How many times `destroy()` ran. */
  public get destroyCount(): number {
    return this.destroys;
  }

  /** Counts the call. */
  public destroy(): void {
    this.destroys += 1;
  }

  /** Records `isPaused`. */
  public setPaused(isPaused: boolean): void {
    this.pauses.push(isPaused);
  }
}

import { fakeMatchEvidence } from '../data/logging/__fixtures__/errorReports';
import type { MatchEvidence } from '../data/logging/ErrorReport.types';
import type { RunningMatch } from './SessionController.types';

/**
 * Test double of a running match (02 §8): counts `destroy()` calls, records every pause and
 * answers `evidence()` with the evidence it was built with.
 */
export class FakeRunningMatch implements RunningMatch {
  /** Every `setPaused` argument, in call order. */
  public readonly pauses: boolean[] = [];
  private destroys = 0;

  /** @param matchEvidence - What `evidence()` returns; a new `fakeMatchEvidence()` by default. */
  public constructor(private readonly matchEvidence: MatchEvidence = fakeMatchEvidence()) {}

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

  /** The evidence it was built with. */
  public evidence(): MatchEvidence {
    return this.matchEvidence;
  }
}

import type { MatchDirector } from '../match/MatchDirector';
import type { System, SystemContext } from './System.types';

/**
 * Runs the match director once per tick (architecture 12 §1): a thin adapter, so the director's
 * steps keep their fixed order in one class. It runs after `DeathSystem` and before
 * `InvariantSystem`, so the snapshot of a tick already carries that tick's phase.
 */
export class MatchDirectorSystem implements System {
  public readonly name = 'match-director';

  /** @param director - The match's director, built and started by `Simulation`. */
  public constructor(private readonly director: Pick<MatchDirector, 'update'>) {}

  /** Advances the match's timeline and phase by one tick. */
  public update({ state }: SystemContext): void {
    this.director.update(state);
  }
}

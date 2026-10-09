import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { System, SystemContext } from './System.types';

/** Checks the invariants at the end of every tick (architecture 15 §2). Runs last. */
export class InvariantSystem implements System {
  public readonly name = 'invariants';

  /** Creates the system around the runner that holds the invariants and the debug settings. */
  public constructor(private readonly runner: InvariantRunner) {}

  /** Runs the invariants that are due this tick. */
  public update({ state }: SystemContext): void {
    this.runner.run(state);
  }
}

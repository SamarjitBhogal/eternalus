import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import { DeathSystem } from './DeathSystem';
import { InvariantSystem } from './InvariantSystem';
import { MovementSystem } from './MovementSystem';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order: movement, then death, then invariants last. This is
 * the one place a system is added, at its position in the tick (architecture 02 §9).
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /** Creates the pipeline; `invariants` is the runner the last system checks with. */
  public constructor(invariants: InvariantRunner) {
    super([new MovementSystem(), new DeathSystem(), new InvariantSystem(invariants)]);
  }
}

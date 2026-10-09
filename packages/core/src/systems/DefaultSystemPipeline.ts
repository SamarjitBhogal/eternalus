import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import { DeathSystem } from './DeathSystem';
import { InvariantSystem } from './InvariantSystem';
import { MovementSystem } from './MovementSystem';
import type { System } from './System.types';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order: decisions (AI), movement, then death, then invariants last. This is
 * the one place a system is added, at its position in the tick (architecture 02 §9).
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /**
   * Creates the pipeline.
   *
   * @param invariants - The runner the last system checks with.
   * @param decide - Systems that run first, before movement: `AiSystem`, which `systems/` may not
   *   import, so `Simulation` passes it in.
   */
  public constructor(invariants: InvariantRunner, decide: readonly System[] = []) {
    super([...decide, new MovementSystem(), new DeathSystem(), new InvariantSystem(invariants)]);
  }
}

import type { ControllerSpawn } from '../entities/EntityFactory.types';
import type { SlotReadiness } from '../state/SlotReadiness.types';

/**
 * What `createDefaultCommandHandlers` is built from: content and the cast rule, which `commands/`
 * may not import.
 */
export type DefaultCommandHandlerDeps = {
  /** The Rover bot's controller, difficulty and memory: a `dev-spawn-legend` Legend plays it. */
  readonly rover: ControllerSpawn;
  /**
   * The cast rules `cast-ability` checks with: the match's `abilities/CastValidator`, through the
   * `SlotReadiness` port.
   */
  readonly cast: Pick<SlotReadiness, 'blockedBy'>;
};

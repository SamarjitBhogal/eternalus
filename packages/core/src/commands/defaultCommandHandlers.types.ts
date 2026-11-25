import type { ControllerSpawn } from '../entities/EntityFactory.types';

/** What `createDefaultCommandHandlers` is built from (content `commands/` may not import). */
export type DefaultCommandHandlerDeps = {
  /** The Rover bot's controller, difficulty and memory: a `dev-spawn-legend` Legend plays it. */
  readonly rover: ControllerSpawn;
};

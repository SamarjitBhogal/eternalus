import type { ControllerSpawn } from '../entities/EntityFactory.types';

/** What `createDefaultCommandHandlers` is built from (content `commands/` may not import). */
export type DefaultCommandHandlerDeps = {
  /** The Rover bot's controller, difficulty and memory: a `dev-spawn-legend` Legend plays it. */
  readonly rover: ControllerSpawn;
  /**
   * By boss profile id, its moves' telegraphs in ticks (`loadBossTelegraphTicks`): the moves
   * `boss-move` accepts from a boss with that profile.
   */
  readonly bossTelegraphTicks: Readonly<Record<string, Readonly<Record<string, number>>>>;
};

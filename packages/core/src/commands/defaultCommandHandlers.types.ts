import type { ControllerSpawn } from '../entities/EntityFactory.types';
import type { MissingRoleChooser } from '../state/missingRoleChooser.types';

/** What `createDefaultCommandHandlers` is built from (content `commands/` may not import). */
export type DefaultCommandHandlerDeps = {
  /** The Rover bot's controller, difficulty and memory: a `dev-spawn-legend` Legend plays it. */
  readonly rover: ControllerSpawn;
  /**
   * The human's controller id (`player` in `CONTROLLER_IDS`; `Simulation` checks it against
   * `ControllerId`): `dev-set-controller` with it seats the human.
   */
  readonly player: string;
  /**
   * The bot the human's Legend becomes when `dev-set-controller` takes the human off it: the role
   * its team lacks (`createMissingRoleChooser`).
   */
  readonly missingRole: MissingRoleChooser;
};

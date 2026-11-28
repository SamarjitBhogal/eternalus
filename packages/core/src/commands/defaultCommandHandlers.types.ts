import type { ControllerSpawn } from '../entities/EntityFactory.types';
import type { MissingRoleChooser, PickedBotChooser } from '../state/missingRoleChooser.types';

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
   * The bot a Legend becomes when `dev-set-controller` picks no bot (`null`), or takes the human off
   * it on a seat move: the role its team lacks (`createMissingRoleChooser`).
   */
  readonly missingRole: MissingRoleChooser;
  /** The bot a `dev-set-controller` bot id gives a Legend (`createPickedBotChooser`, DEC-356). */
  readonly pickedBot: PickedBotChooser;
  /**
   * By boss profile id, its moves' telegraphs in ticks (`loadBossTelegraphTicks`): the moves
   * `boss-move` accepts from a boss with that profile.
   */
  readonly bossTelegraphTicks: Readonly<Record<string, Readonly<Record<string, number>>>>;
};

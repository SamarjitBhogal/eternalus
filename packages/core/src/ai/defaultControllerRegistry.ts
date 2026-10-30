import type { ControllerId } from '../content/ai/ai.types';
import type { Controller } from './Controller.types';
import { GuardController } from './GuardController';
import { MinionController } from './MinionController';
import type { MinionControllerContent } from './MinionController.types';

/** Every controller by id (architecture 11 §2); an id with no controller yet is absent. */
export type ControllerRegistry = Readonly<Partial<Record<ControllerId, Controller>>>;

/**
 * The controller registry: one line per controller (architecture 02 §9).
 *
 * @param content - What the controllers read besides the state, injected by `Simulation`.
 * @remarks ponytail: partial until every id has a controller; it becomes total (`Record`, so a
 * missing id does not compile) once the last one lands.
 */
export const createDefaultControllerRegistry = (
  content: MinionControllerContent,
): ControllerRegistry => ({
  minion: new MinionController(content),
  guard: new GuardController(content),
});

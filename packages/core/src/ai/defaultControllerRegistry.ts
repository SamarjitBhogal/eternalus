import type { ControllerId } from '../content/ai/ai.types';
import type { Controller } from './Controller.types';

/** Every controller by id (architecture 11 §2); an id with no controller yet is absent. */
export type ControllerRegistry = Readonly<Partial<Record<ControllerId, Controller>>>;

/**
 * The controller registry: one line per controller (architecture 02 §9).
 *
 * @remarks ponytail: empty until the first controller (`MinionController`, minion plan M2b); the
 * map becomes total (`Record`, so a missing id does not compile) once every id has one.
 */
export const createDefaultControllerRegistry = (): ControllerRegistry => ({});

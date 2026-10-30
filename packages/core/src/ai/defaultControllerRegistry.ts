import type { ControllerId } from '../content/ai/ai.types';
import { BotLegendController } from './BotLegendController';
import type { BotLegendControllerContent } from './BotLegendController.types';
import type { Controller } from './Controller.types';
import { MinionController } from './MinionController';
import type { MinionControllerContent } from './MinionController.types';
import { RoverController } from './RoverController';
import type { RoverControllerContent } from './RoverController.types';

/** Every controller by id (architecture 11 §2); an id with no controller yet is absent. */
export type ControllerRegistry = Readonly<Partial<Record<ControllerId, Controller>>>;

/**
 * The controller registry: one line per controller (architecture 02 §9).
 *
 * @param content - What each controller reads besides the state, injected by `Simulation`.
 * @remarks ponytail: partial until every id has a controller; it becomes total (`Record`, so a
 * missing id does not compile) once the last one lands.
 */
export const createDefaultControllerRegistry = (content: {
  readonly minion: MinionControllerContent;
  readonly botLegend: BotLegendControllerContent;
  readonly rover: RoverControllerContent;
}): ControllerRegistry => ({
  minion: new MinionController(content.minion),
  'bot-legend': new BotLegendController(content.botLegend),
  rover: new RoverController(content.rover),
});

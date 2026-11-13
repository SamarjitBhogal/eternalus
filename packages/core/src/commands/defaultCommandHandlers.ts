import type { ControllerSpawn } from '../entities/EntityFactory.types';
import type { CommandHandlers } from './CommandHandler.types';
import { AttackTargetHandler } from './handlers/AttackTargetHandler';
import { DevRemoveEntityHandler } from './handlers/DevRemoveEntityHandler';
import { DevSpawnHandler } from './handlers/DevSpawnHandler';
import { DevSpawnLegendHandler } from './handlers/DevSpawnLegendHandler';
import { DevSpawnMobsHandler } from './handlers/DevSpawnMobsHandler';
import { MoveHandler } from './handlers/MoveHandler';
import { StopHandler } from './handlers/StopHandler';
import { UnsupportedCommandHandler } from './handlers/UnsupportedCommandHandler';

/**
 * The command registry: one line per command type (architecture 02 §9).
 *
 * @param devLegendController - The controller `dev-spawn-legend` gives its Legend; `Simulation`
 *   passes it in because `commands/` may not read `content/`.
 */
export const createDefaultCommandHandlers = (
  devLegendController: ControllerSpawn,
): CommandHandlers => {
  const unsupported = new UnsupportedCommandHandler();
  return {
    move: new MoveHandler(),
    stop: new StopHandler(),
    'attack-target': new AttackTargetHandler(),
    'cast-ability': unsupported, // TODO(sholtzman): with phase 2 abilities
    intent: unsupported, // TODO(sholtzman): with sprint 1.5 PlayerController
    'dev-spawn': new DevSpawnHandler(),
    'dev-spawn-legend': new DevSpawnLegendHandler(devLegendController),
    'dev-spawn-mobs': new DevSpawnMobsHandler(),
    'dev-remove-entity': new DevRemoveEntityHandler(),
    'dev-set-controller': unsupported, // TODO(sholtzman): with the controller registry (AI)
  };
};

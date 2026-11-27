import type { CommandHandlers } from './CommandHandler.types';
import type { DefaultCommandHandlerDeps } from './defaultCommandHandlers.types';
import { AttackTargetHandler } from './handlers/AttackTargetHandler';
import { DevMatchToolsHandler } from './handlers/DevMatchToolsHandler';
import { DevRemoveEntityHandler } from './handlers/DevRemoveEntityHandler';
import { DevRemoveLegendHandler } from './handlers/DevRemoveLegendHandler';
import { DevSpawnHandler } from './handlers/DevSpawnHandler';
import { DevSpawnLegendHandler } from './handlers/DevSpawnLegendHandler';
import { DevSpawnMobsHandler } from './handlers/DevSpawnMobsHandler';
import { MoveHandler } from './handlers/MoveHandler';
import { StopHandler } from './handlers/StopHandler';
import { UnsupportedCommandHandler } from './handlers/UnsupportedCommandHandler';

/**
 * The command registry: one line per command type (architecture 02 §9).
 *
 * @param deps - What the handlers need from `content/`, which `commands/` may not read;
 *   `Simulation` passes it in. One object, so a new dependency adds a field, not a parameter.
 */
export const createDefaultCommandHandlers = ({
  rover,
}: DefaultCommandHandlerDeps): CommandHandlers => {
  const unsupported = new UnsupportedCommandHandler();
  const removeEntity = new DevRemoveEntityHandler();
  const matchTools = new DevMatchToolsHandler();
  return {
    move: new MoveHandler(),
    stop: new StopHandler(),
    'attack-target': new AttackTargetHandler(),
    'cast-ability': unsupported, // TODO(sholtzman): with phase 2 abilities
    intent: unsupported, // TODO(sholtzman): with sprint 1.5 PlayerController
    'dev-spawn': new DevSpawnHandler(),
    'dev-spawn-legend': new DevSpawnLegendHandler(rover),
    'dev-spawn-mobs': new DevSpawnMobsHandler(),
    'dev-remove-entity': removeEntity,
    'dev-remove-legend': new DevRemoveLegendHandler(removeEntity),
    'dev-set-controller': unsupported, // TODO(sholtzman): with the controller registry (AI)
    'dev-teleport': matchTools,
    'dev-level-up': matchTools,
    'dev-destroy-buildings': matchTools,
    'dev-end-match': matchTools,
  };
};

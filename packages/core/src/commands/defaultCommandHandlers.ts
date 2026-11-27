import type { CommandHandlers } from './CommandHandler.types';
import type { DefaultCommandHandlerDeps } from './defaultCommandHandlers.types';
import { AttackAimHandler } from './handlers/AttackAimHandler';
import { AttackTargetHandler } from './handlers/AttackTargetHandler';
import { CastAbilityHandler } from './handlers/CastAbilityHandler';
import { DevRemoveEntityHandler } from './handlers/DevRemoveEntityHandler';
import { DevRemoveLegendHandler } from './handlers/DevRemoveLegendHandler';
import { DevSpawnHandler } from './handlers/DevSpawnHandler';
import { DevSpawnLegendHandler } from './handlers/DevSpawnLegendHandler';
import { DevSpawnMobsHandler } from './handlers/DevSpawnMobsHandler';
import { MoveHandler } from './handlers/MoveHandler';
import { StopHandler } from './handlers/StopHandler';
import { SwitchAmmoHandler } from './handlers/SwitchAmmoHandler';
import { UnsupportedCommandHandler } from './handlers/UnsupportedCommandHandler';

/**
 * The command registry: one line per command type (architecture 02 §9).
 *
 * @param deps - What the handlers need from `content/` and `abilities/`, which `commands/` may not
 *   read; `Simulation` passes it in. One object, so a new dependency adds a field, not a parameter.
 */
export const createDefaultCommandHandlers = ({
  rover,
  cast,
}: DefaultCommandHandlerDeps): CommandHandlers => {
  const unsupported = new UnsupportedCommandHandler();
  const removeEntity = new DevRemoveEntityHandler();
  return {
    move: new MoveHandler(),
    stop: new StopHandler(),
    'attack-target': new AttackTargetHandler(),
    'attack-aim': new AttackAimHandler(),
    'switch-ammo': new SwitchAmmoHandler(),
    'cast-ability': new CastAbilityHandler(cast),
    intent: unsupported, // TODO(sholtzman): with sprint 1.5 PlayerController
    'dev-spawn': new DevSpawnHandler(),
    'dev-spawn-legend': new DevSpawnLegendHandler(rover),
    'dev-spawn-mobs': new DevSpawnMobsHandler(),
    'dev-remove-entity': removeEntity,
    'dev-remove-legend': new DevRemoveLegendHandler(removeEntity),
    'dev-set-controller': unsupported, // TODO(sholtzman): with the controller registry (AI)
  };
};

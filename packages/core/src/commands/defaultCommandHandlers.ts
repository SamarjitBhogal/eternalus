import type { CommandHandlers } from './CommandHandler.types';
import { AttackTargetHandler } from './handlers/AttackTargetHandler';
import { CastAbilityHandler } from './handlers/CastAbilityHandler';
import type { CastCheck } from './handlers/CastAbilityHandler.types';
import { DevRemoveEntityHandler } from './handlers/DevRemoveEntityHandler';
import { DevSpawnHandler } from './handlers/DevSpawnHandler';
import { DevSpawnMobsHandler } from './handlers/DevSpawnMobsHandler';
import { MoveHandler } from './handlers/MoveHandler';
import { StopHandler } from './handlers/StopHandler';
import { UnsupportedCommandHandler } from './handlers/UnsupportedCommandHandler';

/**
 * The command registry: one line per command type (architecture 02 §9).
 *
 * @param cast - The cast rules `cast-ability` checks with (`abilities/CastValidator`, injected
 *   because `commands/` may not import `abilities/`).
 */
export const createDefaultCommandHandlers = (cast: CastCheck): CommandHandlers => {
  const unsupported = new UnsupportedCommandHandler();
  return {
    move: new MoveHandler(),
    stop: new StopHandler(),
    'attack-target': new AttackTargetHandler(),
    'cast-ability': new CastAbilityHandler(cast),
    intent: unsupported, // TODO(sholtzman): with sprint 1.5 PlayerController
    'dev-spawn': new DevSpawnHandler(),
    'dev-spawn-mobs': new DevSpawnMobsHandler(),
    'dev-remove-entity': new DevRemoveEntityHandler(),
    'dev-set-controller': unsupported, // TODO(sholtzman): with the controller registry (AI)
  };
};

import type { CommandHandlers } from './CommandHandler.types';
import { AttackTargetHandler } from './handlers/AttackTargetHandler';
import { BossMoveHandler } from './handlers/BossMoveHandler';
import { DevRemoveEntityHandler } from './handlers/DevRemoveEntityHandler';
import { DevSpawnHandler } from './handlers/DevSpawnHandler';
import { DevSpawnMobsHandler } from './handlers/DevSpawnMobsHandler';
import { MoveHandler } from './handlers/MoveHandler';
import { StopHandler } from './handlers/StopHandler';
import { UnsupportedCommandHandler } from './handlers/UnsupportedCommandHandler';

/**
 * The command registry: one line per command type (architecture 02 §9).
 *
 * @param bossTelegraphTicks - By boss profile id, its moves' telegraphs in ticks
 *   (`loadBossTelegraphTicks`): the moves `boss-move` accepts from a boss with that profile.
 */
export const createDefaultCommandHandlers = (
  bossTelegraphTicks: Readonly<Record<string, Readonly<Record<string, number>>>>,
): CommandHandlers => {
  const unsupported = new UnsupportedCommandHandler();
  return {
    move: new MoveHandler(),
    stop: new StopHandler(),
    'attack-target': new AttackTargetHandler(),
    'boss-move': new BossMoveHandler(bossTelegraphTicks),
    'cast-ability': unsupported, // TODO(sholtzman): with phase 2 abilities
    intent: unsupported, // TODO(sholtzman): with sprint 1.5 PlayerController
    'dev-spawn': new DevSpawnHandler(),
    'dev-spawn-mobs': new DevSpawnMobsHandler(),
    'dev-remove-entity': new DevRemoveEntityHandler(),
    'dev-set-controller': unsupported, // TODO(sholtzman): with the controller registry (AI)
  };
};

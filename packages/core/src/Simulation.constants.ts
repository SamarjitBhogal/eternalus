import { ROVER_BOT } from './content/ai/difficulties/rover';
import type { ControllerSpawn } from './entities/EntityFactory.types';

/**
 * The Rover bot a developer-menu Legend plays (`dev-spawn-legend`, DEC-293; `dev-set-controller`,
 * DEC-294): the `rover` controller at the `rover` difficulty, with an empty memory.
 */
export const ROVER_SPAWN = {
  controllerId: 'rover',
  profileId: ROVER_BOT.id,
  memory: {},
} as const satisfies ControllerSpawn;

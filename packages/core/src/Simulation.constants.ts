import { ROVER_BOT } from './content/ai/difficulties/rover';
import { BOT_ROSTER } from './content/teams/botRoster';
import type { ControllerSpawn } from './entities/EntityFactory.types';
import type { MissingRoleBots } from './state/missingRoleChooser.types';

/**
 * The Rover bot a developer-menu Legend plays (`dev-spawn-legend`, DEC-293; `dev-set-controller`,
 * DEC-356): the `rover` controller at the `rover` difficulty, with an empty memory.
 */
export const ROVER_SPAWN = {
  controllerId: 'rover',
  profileId: ROVER_BOT.id,
  memory: {},
} as const satisfies ControllerSpawn;

/**
 * The two bots `dev-set-controller` hands a Legend to (architecture 11 §7, 18 §8; DEC-356): the
 * Rover, and the `bot-legend` lane bot at the bot roster's lane-bot difficulty.
 */
export const SIM_MODE_BOTS = {
  rover: ROVER_SPAWN,
  laner: { controllerId: 'bot-legend', profileId: BOT_ROSTER.difficulties.laner },
} as const satisfies MissingRoleBots;

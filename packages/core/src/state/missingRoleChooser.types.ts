import type { ControllerId } from '../content/ai/ai.types';
import type { ControllerSpawn } from '../entities/EntityFactory.types';
import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';
import type { PlayableTeam } from '../teams/teams.types';

/**
 * Picks the bot a Legend becomes when the human leaves it with no bot picked (architecture 11 §7,
 * 18 §8): the role its team lacks. Built by `Simulation` from content, so `commands/` reads no
 * content.
 *
 * @param state - The match, before the Legend is re-bound.
 * @param legendId - The Legend the human leaves; it is not counted as one of its team's bots.
 * @param team - The Legend's team.
 * @returns The controller, difficulty and starting memory the Legend's new brain gets.
 */
export type MissingRoleChooser = (
  state: GameState,
  legendId: EntityId,
  team: PlayableTeam,
) => ControllerSpawn;

/**
 * Gives the bot a developer picks for a Legend in sim mode (architecture 11 §7, DEC-356). Built by
 * `Simulation` from content, like `MissingRoleChooser`.
 *
 * @param state - The match, before the Legend is re-bound.
 * @param legendId - The Legend; it is not counted as one of its team's bots.
 * @param team - The Legend's team.
 * @param controllerId - The picked bot's controller id.
 * @returns The controller, difficulty and starting memory the Legend's new brain gets, or
 *   `undefined` when `controllerId` names no bot.
 */
export type PickedBotChooser = (
  state: GameState,
  legendId: EntityId,
  team: PlayableTeam,
  controllerId: string,
) => ControllerSpawn | undefined;

/** A team's bots: whether one plays the Rover, and how many lane bots each lane has. */
export type TeamBots = {
  readonly hasRover: boolean;
  readonly occupied: Readonly<Record<string, number>>;
};

/** The two bot roles the choosers pick between (architecture 18 §8). */
export type MissingRoleBots = {
  /** The Rover bot, which takes no lane: its controller, difficulty and memory. */
  readonly rover: ControllerSpawn;
  /** The lane bot: its controller and difficulty; its memory is `{ lane }`. */
  readonly laner: { readonly controllerId: ControllerId; readonly profileId: string };
};

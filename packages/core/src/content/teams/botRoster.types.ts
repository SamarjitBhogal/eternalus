import type { LegendClassId } from '../legends/legends.types';

/**
 * How the enemy team's Rover is picked. One rule today: it copies the player's class and Legend
 * (DEC-61). A new rule is a new member here and one entry in the client's rule registry.
 */
export type EnemyRoverRule = 'mirror-player';

/**
 * The bots of a match (DEC-61, DEC-102): each team's lane bots by class, in lane-fill order, and
 * how the enemy Rover is picked. Each team's other member is its Rover: the player on their team.
 */
export type BotRosterDefinition = {
  readonly id: string;
  /**
   * Each team's lane bots, in the order the match assigns them to lanes. Both teams field the same
   * lane bots; the player's team adds the player, the enemy team its Rover.
   */
  readonly laners: readonly LegendClassId[];
  readonly enemyRover: EnemyRoverRule;
};

import { ATTACK_REACH_RADII } from './BotNavigator.constants';
import type { BotBody, BotIntent, BotPoint, WaypointSource } from './BotNavigator.types';

/**
 * Decides one bot's intent per state: walk along the path to the enemy Legend (core's A\*, so
 * obstacles are rounded, not rammed), face it, and hold the attack once it is within reach.
 */
export class BotNavigator {
  private readonly next = { x: 0, y: 0 };

  public constructor(private readonly paths: WaypointSource) {}

  /** Whether `enemy` is close enough to `own` to attack. */
  public static isInReach(own: BotBody, enemy: BotPoint): boolean {
    return Math.hypot(enemy.x - own.x, enemy.y - own.y) <= own.radius * ATTACK_REACH_RADII;
  }

  /** The intent that closes on `enemy`: stand and attack in reach, else step toward the path. */
  public step(own: BotBody, enemy: BotPoint): BotIntent {
    const aim = { x: enemy.x, y: enemy.y };
    if (BotNavigator.isInReach(own, enemy)) {
      return { move: { x: 0, y: 0 }, aim, triggered: [], isAttacking: true };
    }
    const hasWay = this.paths.waypoint(own, enemy, this.next);
    const dx = this.next.x - own.x;
    const dy = this.next.y - own.y;
    const length = Math.hypot(dx, dy);
    const move = hasWay && length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 };
    return { move, aim, triggered: [], isAttacking: false };
  }
}

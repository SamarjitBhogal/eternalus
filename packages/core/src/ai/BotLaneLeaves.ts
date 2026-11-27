import type { MutableVec2 } from '../utils/vec2.types';
import type { Vec2 } from '../utils/geometry.types';
import type { BotTurn } from './BotLegendController.types';

/**
 * The lane-following leaves of the bot trees (architecture 11 §4.2): finding where the lead
 * allied horde stands on a lane, and the nearest point of the lane corridor. Both write
 * `turn.destination`, which `BotLeaves.moveTo` then walks to. Stateless apart from scratch.
 */
export class BotLaneLeaves {
  private readonly anchor: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };

  /** Finds the anchor of the most advanced allied horde on `lane`. */
  public findHorde(turn: BotTurn, lane: string): boolean {
    const { state, team } = turn;
    const routes = state.world?.routes ?? null;
    let lead = -1;
    state.hordes.forEach((horde) => {
      // The progress is all that is read, so which of two equal hordes wins does not matter.
      if (horde.team === team && horde.lane === lane && horde.progress > lead) {
        lead = horde.progress;
      }
    });
    if (routes === null || lead < 0) {
      return false;
    }
    routes.pose(lane, team, lead, this.anchor, this.forward);
    turn.destination = { x: this.anchor.x, y: this.anchor.y };
    return true;
  }

  /** Finds the nearest point of `lane` to `point` (the lane corridor, 11 §4.2). */
  public findLanePoint(turn: BotTurn, lane: string, point: Vec2): boolean {
    const routes = turn.state.world?.routes ?? null;
    if (routes === null || lane === '') {
      return false;
    }
    routes.pose(
      lane,
      turn.team,
      routes.distanceAlong(lane, turn.team, point),
      this.anchor,
      this.forward,
    );
    turn.destination = { x: this.anchor.x, y: this.anchor.y };
    return true;
  }
}

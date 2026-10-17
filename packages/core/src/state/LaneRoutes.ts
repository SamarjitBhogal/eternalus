import type { MapDefinition, MapLane } from '../content/maps/maps.types';
import type { PlayableTeam } from '../teams/teams.types';
import { distance } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';

/** One team's walk of one lane: its waypoints and the distance from the gate to each. */
type Route = {
  readonly points: readonly Vec2[];
  /** `along[i]` is the path length from `points[0]` to `points[i]`. */
  readonly along: readonly number[];
};

const routeOf = (points: readonly Vec2[]): Route => {
  const along = [0];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const here = points[index];
    along.push(
      (along[index - 1] ?? 0) +
        (previous === undefined || here === undefined ? 0 : distance(previous, here)),
    );
  }
  return { points, along };
};

/**
 * The map's lanes as each team walks them (architecture 18 §3.2): a lane path runs from the Light
 * gate to the Dark gate, so Dark walks it reversed. Positions on a lane are distances in world
 * units from the walking team's own gate (18 §4). Built once per match.
 */
export class LaneRoutes {
  /** Every lane, by ascending index. */
  public readonly lanes: readonly MapLane[];

  private readonly routes = new Map<string, Readonly<Record<PlayableTeam, Route>>>();

  /** @param map - The generated map of the match. */
  public constructor(map: MapDefinition) {
    this.lanes = [...map.lanes].sort((a, b) => a.index - b.index);
    for (const lane of this.lanes) {
      this.routes.set(lane.id, {
        light: routeOf(lane.path),
        dark: routeOf([...lane.path].reverse()),
      });
    }
  }

  /**
   * The path length of lane `laneId`.
   *
   * @throws Error when the map has no such lane.
   */
  public length(laneId: string): number {
    const { along } = this.route(laneId, 'light');
    return along[along.length - 1] ?? 0;
  }

  /**
   * How far along lane `laneId`, from `team`'s gate, the lane point nearest `point` is.
   *
   * @throws Error when the map has no such lane.
   */
  public distanceAlong(laneId: string, team: PlayableTeam, point: Vec2): number {
    const { points, along } = this.route(laneId, team);
    let best = 0;
    let bestGap = Number.POSITIVE_INFINITY;
    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1];
      const b = points[index];
      if (a === undefined || b === undefined) {
        continue;
      }
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const span = dx * dx + dy * dy;
      const t =
        span === 0
          ? 0
          : Math.min(1, Math.max(0, ((point.x - a.x) * dx + (point.y - a.y) * dy) / span));
      const gap = distance(point, { x: a.x + t * dx, y: a.y + t * dy });
      if (gap < bestGap) {
        bestGap = gap;
        best = (along[index - 1] ?? 0) + t * ((along[index] ?? 0) - (along[index - 1] ?? 0));
      }
    }
    return best;
  }

  /**
   * Writes the lane point `along` world units from `team`'s gate into `point`, and the unit
   * walking direction there into `forward`. `along` is clamped to the lane. Allocates nothing.
   *
   * @throws Error when the map has no such lane.
   */
  public pose(
    laneId: string,
    team: PlayableTeam,
    along: number,
    point: MutableVec2,
    forward: MutableVec2,
  ): void {
    const route = this.route(laneId, team);
    const { points } = route;
    let segment = 1;
    while (segment < points.length - 1 && (route.along[segment] ?? 0) < along) {
      segment += 1;
    }
    const a = points[segment - 1] ?? points[0] ?? { x: 0, y: 0 };
    const b = points[segment] ?? a;
    const start = route.along[segment - 1] ?? 0;
    const span = (route.along[segment] ?? start) - start;
    const t = span === 0 ? 0 : Math.min(1, Math.max(0, (along - start) / span));
    point.x = a.x + t * (b.x - a.x);
    point.y = a.y + t * (b.y - a.y);
    forward.x = span === 0 ? 0 : (b.x - a.x) / span;
    forward.y = span === 0 ? 0 : (b.y - a.y) / span;
  }

  private route(laneId: string, team: PlayableTeam): Route {
    const route = this.routes.get(laneId);
    if (route === undefined) {
      throw new Error(`The map has no lane "${laneId}".`);
    }
    return route[team];
  }
}

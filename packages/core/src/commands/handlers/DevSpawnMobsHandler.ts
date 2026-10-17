import { HORDE_WEIGHT_CLASSES } from '../../state/Horde.constants';
import type { HordeRequest } from '../../state/HordeRequest.types';
import type { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';
import type { Command, CommandRejectReason, SpawnOrigin } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Developer menu: queues one horde of `count` mobs (architecture 13 §4, 18 §3.5, DEC-46), which
 * `SpawnSystem` fulfils at the end of the tick like a scheduled wave, clipped to the unit cap.
 * The origin picks the lane: a structure's own lane, a lane and a fraction of it from the Light
 * gate, or the lane nearest a point (the lower index on a tie).
 */
export class DevSpawnMobsHandler implements CommandHandler<'dev-spawn-mobs'> {
  /** Validates the mob, the count and the origin, then queues the horde. */
  public handle(
    { team, definitionId, count, origin }: Command<'dev-spawn-mobs'>,
    { state, factory }: CommandContext,
  ): CommandRejectReason | null {
    const weightClass = HORDE_WEIGHT_CLASSES.find((weight) =>
      factory.canCreate(`${weight}-mob`, definitionId),
    );
    if (weightClass === undefined) {
      return 'unknown-definition';
    }
    if (!Number.isInteger(count) || count < 1) {
      return 'invalid-count';
    }
    const placed = DevSpawnMobsHandler.place(state, origin);
    if (placed === null) {
      return 'invalid-origin';
    }
    const request: HordeRequest = { team, mobId: definitionId, weightClass, count, ...placed };
    state.hordeRequests.push(request);
    return null;
  }

  /** The lane and the spawn point an origin names, or `null` when it names none. */
  private static place(
    state: GameState,
    origin: SpawnOrigin,
  ): { readonly lane: string; readonly origin: Vec2 } | null {
    const { map, routes } = state;
    if (map === null || routes === null) {
      return null;
    }
    if (origin.kind === 'structure') {
      const feature = map.features.find(({ id }) => id === origin.structureId);
      return feature?.laneId === undefined
        ? null
        : { lane: feature.laneId, origin: feature.position };
    }
    if (origin.kind === 'lane') {
      if (!routes.lanes.some(({ id }) => id === origin.lane) || !(origin.t >= 0 && origin.t <= 1)) {
        return null;
      }
      const point = { x: 0, y: 0 };
      routes.pose(origin.lane, 'light', origin.t * routes.length(origin.lane), point, {
        x: 0,
        y: 0,
      });
      return { lane: origin.lane, origin: point };
    }
    const lane =
      Number.isFinite(origin.at.x) && Number.isFinite(origin.at.y)
        ? routes.nearestLane(origin.at)
        : undefined;
    return lane === undefined ? null : { lane: lane.id, origin: origin.at };
  }
}

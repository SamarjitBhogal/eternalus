import { Movement } from '../../components/Movement';
import type { DashSpec } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { dashReach } from '../dashReach';

/**
 * Dashes the caster `distance` metres along the cast's direction (architecture 05 §3) as forced
 * motion over `durationTicks` (plan arch call 6). The path is resolved at cast (plan arch call 9):
 * it ends where `WorldMap.isLineClear` first finds blocked ground, so the dash never aims through a
 * wall, and walls and world bounds stop the motion itself as they stop walking. The whole cast
 * resolves at cast too: `onPath` runs once on the path's sweep, so each unit on it is hit once,
 * and `onEnd` runs at the path's end point, while the caster is still on the way (it arrives
 * `durationTicks` later).
 */
export class DashEffect implements AbilityEffect<DashSpec> {
  public readonly kind = 'dash';

  /** Starts the dash and runs its path and end steps. */
  public apply(spec: DashSpec, cast: CastContext): void {
    const { direction } = cast;
    const from = cast.placement.to;
    const reach = dashReach(cast.state.world?.grid, from, direction, spec.distance);
    const to = { x: from.x + direction.x * reach, y: from.y + direction.y * reach };
    cast.state.entities
      .get(cast.casterId)
      ?.findComponent(Movement)
      ?.push({ x: to.x - from.x, y: to.y - from.y }, spec.durationTicks);
    for (const step of spec.onPath) {
      cast.run(step, { from, to });
    }
    for (const step of spec.onEnd) {
      cast.run(step, { from: to, to });
    }
  }
}

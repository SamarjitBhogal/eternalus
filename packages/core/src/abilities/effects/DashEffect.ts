import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { DashSpec } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext, NestedDescriber } from '../AbilityEffect.types';
import { dashReach } from '../dashReach';
import { mustBePositive } from '../specChecks';

/**
 * Dashes the caster `distance` metres along the cast's direction (architecture 05 §3) as forced
 * motion over `durationTicks` (plan arch call 6). The path is resolved at cast (plan arch call 9):
 * it ends where the caster's circle first touches a wall or the map's edge (`dashReach`, the sweep
 * `CollisionSystem` moves units with), so the dash never aims through a wall, and walls and world
 * bounds stop the motion itself as they stop walking. The whole cast resolves at cast too:
 * `onPath` runs once on the path's sweep, so each unit on it is hit once, and `onEnd` runs at the
 * path's end point, while the caster is still on the way (it arrives `durationTicks` later).
 */
export class DashEffect implements AbilityEffect<DashSpec> {
  public readonly kind = 'dash';

  /** A dash needs a positive distance and at least one tick; the registry checks its steps. */
  public validate(spec: DashSpec): readonly string[] {
    return [
      ...mustBePositive(spec.distance, 'dash distance'),
      ...mustBePositive(spec.durationTicks, 'dash duration'),
    ];
  }

  /**
   * The dash's own row, then its `onPath` and `onEnd` steps' rows: the lane it sweeps is a path
   * `distance` long and as wide as the widest path area it hits on the way (0 when it has none).
   */
  public describe(spec: DashSpec, nested: NestedDescriber): readonly AbilityDisplayStep[] {
    const width = Math.max(
      0,
      ...spec.onPath.map(({ shape }) => (shape.kind === 'path' ? shape.width : 0)),
    );
    return [
      { kind: this.kind, shape: { kind: 'path', width }, distance: spec.distance },
      ...spec.onPath.flatMap(nested),
      ...spec.onEnd.flatMap(nested),
    ];
  }

  /** Starts the dash and runs its path and end steps. */
  public apply(spec: DashSpec, cast: CastContext): void {
    const { direction } = cast;
    const from = cast.placement.to;
    const caster = cast.state.entities.get(cast.casterId);
    const radius = caster?.findComponent(Transform)?.radius ?? 0;
    const reach = dashReach(cast.state.world, from, direction, spec.distance, radius);
    const to = { x: from.x + direction.x * reach, y: from.y + direction.y * reach };
    caster
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

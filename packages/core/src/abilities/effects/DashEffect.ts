import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { DashSpec } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type {
  AbilityEffect,
  CastContext,
  NestedDescriber,
  WithoutTimes,
} from '../AbilityEffect.types';
import { dashReach } from '../dashReach';
import { mustBePositive } from '../specChecks';

/**
 * Dashes the caster `distance` metres along the cast's direction (architecture 05 §3) as forced
 * motion over `durationTicks` (plan arch call 6). The path is resolved at cast (plan arch call 9):
 * it ends where the caster's circle first touches a wall or the map's edge (`dashReach`, the
 * collision rule `CollisionSystem` moves units with), so the dash never aims through a wall, and
 * walls and world bounds stop the motion itself as they stop walking. The whole cast resolves at cast too:
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
   * The dash's own row, which has no area of its own and carries only how far it goes (the
   * overlay draws its path steps that far), then its `onPath` and `onEnd` steps' rows.
   */
  public describe(
    spec: WithoutTimes<DashSpec>,
    nested: NestedDescriber,
  ): readonly AbilityDisplayStep[] {
    return [
      { kind: this.kind, distance: spec.distance },
      ...spec.onPath.flatMap(nested),
      ...spec.onEnd.flatMap(nested),
    ];
  }

  /**
   * Starts the dash and runs its path and end steps.
   *
   * @throws Error when the caster is not in the state or has no `Transform`: the cast check
   *   (`CastValidator`) passed it, so either is a broken invariant.
   */
  public apply(spec: DashSpec, cast: CastContext): void {
    const { direction } = cast;
    const from = cast.placement.to;
    const caster = cast.state.entities.get(cast.casterId);
    if (caster === undefined) {
      throw new Error(`DashEffect: the caster "${cast.casterId}" is not in the state.`);
    }
    const { radius } = caster.getComponent(Transform);
    const reach = dashReach(cast.state.collisions, from, direction, spec.distance, radius);
    const to = { x: from.x + direction.x * reach, y: from.y + direction.y * reach };
    caster
      .findComponent(Movement)
      ?.push({ x: to.x - from.x, y: to.y - from.y }, spec.durationTicks);
    for (const step of spec.onPath) {
      cast.run(step, { from, to });
    }
    for (const step of spec.onEnd) {
      cast.run(step, { from: to, to });
    }
  }
}

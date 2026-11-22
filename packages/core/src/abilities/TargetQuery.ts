import { AreaHitQuery } from '../state/AreaHitQuery';
import type { AreaAim } from '../state/AreaHitQuery.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { AreaShape, ShapePlacement, ShapeSpec } from './shapes/AreaShape.types';
import type { TargetFilter } from './TargetQuery.types';

/** The aim of a step run with none: it aims at no body and no point. */
const NO_AIM: AreaAim = { targetId: null, point: null };

/**
 * Finds what an effect step hits (plan arch call 10): the step's shape placed at `placement`, as
 * the one hit rule for areas sees it (`AreaHitQuery`, DEC-322 (3)), the rule weapon sweeps use. It
 * returns the live entities with a position and health that the shape overlaps, filtered by team
 * relative to the caster, sorted by id, so every run hits in the same order. A body with an
 * outline (a house, a wall, a fort, a structure footprint) is tested by its polygons, as a basic
 * attack reaches it; any other body by its circle. A walk-on outline is hit only when the cast
 * aims at it, and a body that takes no damage now is not hit.
 */
export class TargetQuery {
  private readonly areas = new AreaHitQuery();

  /** @param shapes - Where each shape kind's `AreaShape` is found (the `AbilityRegistry`). */
  public constructor(private readonly shapes: { shapeFor(kind: string): AreaShape }) {}

  /**
   * Every live entity overlapping `shape` at `placement` that passes `filter` for `casterId`, sorted
   * by id.
   *
   * @param aim - What the cast aims at (`CastFacts.aim`); a walk-on outline needs it. Absent: it
   *   aims at nothing.
   * @throws Error when no `AreaShape` is registered for `shape.kind`.
   */
  public find(
    state: GameState,
    casterId: EntityId,
    shape: ShapeSpec,
    placement: ShapePlacement,
    filter: TargetFilter,
    aim: AreaAim = NO_AIM,
  ): readonly EntityId[] {
    const area = this.shapes.shapeFor(shape.kind);
    return this.areas.find(
      state.entities,
      casterId,
      {
        overlapsBody: ({ position, radius }) => area.overlaps(shape, placement, position, radius),
        overlapsOutline: (polygon) => area.overlapsPolygon(shape, placement, polygon),
      },
      aim,
      filter,
    );
  }
}

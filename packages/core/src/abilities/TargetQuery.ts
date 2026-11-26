import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { compareById } from '../utils/compareById';
import type { AreaShape, ShapePlacement, ShapeSpec } from './shapes/AreaShape.types';
import type { TargetFilter } from './TargetQuery.types';

/**
 * Finds what an effect step hits (plan arch call 10): walks the `EntityStore` for live entities
 * with a position and health whose body overlaps the step's shape, filtered by team relative to
 * the caster, and returns their ids sorted by id, so every run hits in the same order. A map object
 * (`MapObjectBody`: a house, a wall, a fort) is tested by its footprints, as a basic attack reaches
 * it; any other body by its circle. A walk, not the `SpatialHash`: casts are rare and the store is
 * small enough.
 */
export class TargetQuery {
  /** @param shapes - Where each shape kind's `AreaShape` is found (the `AbilityRegistry`). */
  public constructor(private readonly shapes: { shapeFor(kind: string): AreaShape }) {}

  /**
   * Every live entity overlapping `shape` at `placement` that passes `filter` for `casterId`, sorted
   * by id.
   *
   * @throws Error when no `AreaShape` is registered for `shape.kind`.
   */
  public find(
    state: GameState,
    casterId: EntityId,
    shape: ShapeSpec,
    placement: ShapePlacement,
    filter: TargetFilter,
  ): readonly EntityId[] {
    const area = this.shapes.shapeFor(shape.kind);
    const casterTeam = state.entities.teamOf(casterId);
    const hits: EntityId[] = [];
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const health = entity.findComponent(Health);
      if (transform === undefined || health === undefined || health.isDead) {
        return;
      }
      if (entity.id === casterId && filter.includeSelf !== true) {
        return;
      }
      const team = entity.findComponent(TeamMembership)?.team;
      const isAlly = team !== undefined && team === casterTeam;
      if ((filter.team === 'allies' && !isAlly) || (filter.team === 'enemies' && isAlly)) {
        return;
      }
      const footprints = entity.findComponent(MapObjectBody)?.object.footprints;
      const isHit =
        footprints === undefined
          ? area.overlaps(shape, placement, transform.position, transform.radius)
          : footprints.some((footprint) => area.overlapsPolygon(shape, placement, footprint));
      if (isHit) {
        hits.push(entity.id);
      }
    });
    return hits.sort(compareById);
  }
}

import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';
import type { UnitFilter } from './Perception.types';

/**
 * What a controller can see (architecture 11 §3): radius-bounded queries over `state.space`, never
 * a scan of the store. Results are in index order, which is store order, so they never depend on
 * the grid layout. One instance per `AiSystem`; its result array is reused, so read a result
 * before the next query.
 *
 * @remarks ponytail: no `structuresWithin` until structure entities exist (minion plan M2c).
 */
export class Perception {
  private found = new Int32Array(0);
  private readonly result: EntityId[] = [];

  /** @param state - The match to look at. */
  public constructor(private readonly state: GameState) {}

  /** The units within `radius` of `center` that pass `filter`, in store order. */
  public unitsWithin(center: Vec2, radius: number, filter: UnitFilter): readonly EntityId[] {
    this.result.length = 0;
    const space = this.state.space;
    if (space === null) {
      return this.result;
    }
    if (this.found.length < space.count) {
      this.found = new Int32Array(Math.max(space.count, 2 * this.found.length));
    }
    const count = space.queryCircle(center.x, center.y, radius, this.found);
    for (let at = 0; at < count; at += 1) {
      const id = space.idAt(this.found[at] ?? 0);
      if (this.passes(id, filter)) {
        this.result.push(id);
      }
    }
    return this.result;
  }

  /** The unit nearest `center` within `radius` that passes `filter`; ties go to store order. */
  public nearest(center: Vec2, radius: number, filter: UnitFilter): EntityId | null {
    const space = this.state.space;
    let best: EntityId | null = null;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const id of this.unitsWithin(center, radius, filter)) {
      const index = space?.indexOf(id) ?? 0;
      const dx = (space?.positions[2 * index] ?? 0) - center.x;
      const dy = (space?.positions[2 * index + 1] ?? 0) - center.y;
      const gap = dx * dx + dy * dy;
      if (gap < bestGap) {
        bestGap = gap;
        best = id;
      }
    }
    return best;
  }

  private passes(id: EntityId, { hostileTo, kinds, aliveOnly }: UnitFilter): boolean {
    const { entities } = this.state;
    const entity = entities.get(id);
    if (entity === undefined) {
      return false;
    }
    const team = entities.teamOf(id);
    return (
      (hostileTo === undefined ||
        (team !== undefined && team !== 'neutral' && team !== hostileTo)) &&
      (kinds === undefined || kinds.includes(entity.kind)) &&
      (aliveOnly !== true || entities.isAlive(id))
    );
  }
}
